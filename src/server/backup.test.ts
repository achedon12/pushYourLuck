import { describe, expect, it, vi } from 'vitest';

const findMany = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: { score: { findMany } } }));

const { quote, dumpScores } = await import('./backup');

/** Concatène le flux SQL produit par le générateur. */
async function dump(): Promise<string> {
    let sql = '';
    for await (const chunk of dumpScores()) sql += chunk;
    return sql;
}

const row = (id: number) => ({
    id,
    game: 'push-your-luck',
    mode: 'daily',
    dayKey: '2026-08-19',
    name: `Joueur ${id}`,
    score: id * 10,
    rounds: 4,
    clientId: `client-${id}`,
    createdAt: new Date('2026-08-19T13:44:07Z'),
});

describe('échappement SQL des sauvegardes', () => {
    it('rend NULL pour une valeur absente', () => {
        expect(quote(null)).toBe('NULL');
        expect(quote(undefined)).toBe('NULL');
    });

    it('laisse les nombres nus et neutralise les non-finis', () => {
        expect(quote(42)).toBe('42');
        expect(quote(-1.5)).toBe('-1.5');
        expect(quote(Number.NaN)).toBe('NULL');
        expect(quote(Number.POSITIVE_INFINITY)).toBe('NULL');
    });

    it('échappe les apostrophes — le cas d’un pseudo comme O’Brien', () => {
        expect(quote("O'Brien")).toBe("'O\\'Brien'");
    });

    it('échappe la barre oblique inverse AVANT les apostrophes', () => {
        // Inverser l'ordre produirait « \\' », soit une apostrophe rouverte.
        expect(quote('a\\b')).toBe("'a\\\\b'");
        expect(quote("a\\'b")).toBe("'a\\\\\\'b'");
    });

    it('échappe les sauts de ligne et l’octet nul', () => {
        expect(quote('a\nb')).toBe("'a\\nb'");
        expect(quote('a\rb')).toBe("'a\\rb'");
        expect(quote('a\0b')).toBe("'a\\0b'");
    });

    it('formate les dates au format attendu par MySQL', () => {
        expect(quote(new Date('2026-08-19T13:44:07.812Z'))).toBe("'2026-08-19 13:44:07'");
    });

    it('convertit les booléens en 0/1', () => {
        expect(quote(true)).toBe('1');
        expect(quote(false)).toBe('0');
    });
});


describe('génération du dump SQL', () => {
    it('produit un en-tête, les insertions et un pied de fichier', async () => {
        findMany.mockResolvedValueOnce([row(1), row(2)]).mockResolvedValueOnce([]);

        const sql = await dump();

        expect(sql).toContain('SET NAMES utf8mb4;');
        expect(sql).toContain('SET FOREIGN_KEY_CHECKS = 0;');
        expect(sql).toContain('INSERT INTO `Score` (`id`, `game`, `mode`, `dayKey`, `name`');
        expect(sql).toContain("'Joueur 1'");
        expect(sql).toContain('SET FOREIGN_KEY_CHECKS = 1;');
        expect(sql).toContain('-- 2 lignes');
    });

    it('pagine par curseur plutôt que par décalage', async () => {
        findMany.mockResolvedValueOnce([row(1), row(2)]).mockResolvedValueOnce([]);

        await dump();

        // Un OFFSET sur une table qui grossit pendant l'export sauterait des
        // lignes ; le curseur sur l'identifiant, non.
        expect(findMany.mock.calls[0][0].where).toEqual({ id: { gt: 0 } });
        expect(findMany.mock.calls[1][0].where).toEqual({ id: { gt: 2 } });
    });

    it('s’arrête proprement sur une base vide', async () => {
        findMany.mockResolvedValueOnce([]);

        const sql = await dump();

        expect(sql).toContain('-- 0 lignes');
        expect(sql).not.toContain('INSERT INTO');
    });
});
