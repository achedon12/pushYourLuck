import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALES } from '@/i18n/config';
import { ROUTE_KEYS } from '@/i18n/routes';

/**
 * Le sitemap interroge la base pour énumérer les mois d'archive : Prisma est
 * simulé, la couche unitaire ne doit jamais toucher une vraie base.
 */
const prismaMock = { score: { findFirst: vi.fn() } };
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { default: sitemap } = await import('./sitemap');
const { default: robots } = await import('./robots');

/** Aucun score en base : le sitemap se réduit aux pages fixes. */
const noScores = () => prismaMock.score.findFirst.mockResolvedValue(null);

const STATIC_COUNT = ROUTE_KEYS.length * LOCALES.length;

describe('plan du site', () => {
    beforeEach(() => {
        prismaMock.score.findFirst.mockReset();
        noScores();
    });

    it('liste chaque page dans chaque langue', async () => {
        expect(await sitemap()).toHaveLength(STATIC_COUNT);
    });

    it('n’utilise que des URL absolues et uniques', async () => {
        const entries = await sitemap();
        for (const entry of entries) expect(entry.url).toMatch(/^https:\/\//);
        expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
    });

    it('déclare les traductions de chaque URL, x-default compris', async () => {
        for (const entry of await sitemap()) {
            const languages = entry.alternates?.languages ?? {};
            expect(Object.keys(languages).sort()).toEqual(['en', 'fr', 'x-default']);
            expect(languages['x-default']).toBe(languages.fr);
        }
    });

    it('donne la priorité maximale à l’accueil', async () => {
        // Repéré par le chemin racine, pas par le domaine : l'assertion doit
        // survivre à un changement de nom de domaine.
        const home = (await sitemap()).find((entry) => new URL(entry.url).pathname === '/');
        expect(home?.priority).toBe(1);
    });

    it('date le classement d’aujourd’hui et le reste de la dernière version', async () => {
        // Dater toutes les pages de « maintenant » à chaque rendu est un signal
        // faux, que les moteurs finissent par ignorer.
        const entries = await sitemap();
        const board = entries.find((entry) => entry.url.endsWith('/classement'));
        const rules = entries.find((entry) => entry.url.endsWith('/regles'));
        expect(Number(board?.lastModified)).toBeGreaterThan(Number(rules?.lastModified));
    });
});

describe('plan du site — archive du classement', () => {
    // Corps en bloc, pas d'expression : une valeur renvoyée par un hook est
    // traitée par Vitest comme une fonction de nettoyage. `mockReset()` renvoie
    // le mock lui-même, que Vitest rappellerait donc après chaque test — en
    // relançant une implémentation qui lève.
    beforeEach(() => {
        prismaMock.score.findFirst.mockReset();
    });

    it('déclare un mois d’archive par langue, du plus ancien score au mois courant', async () => {
        // Trois mois clos avant le mois en cours ; le mois courant n'entre pas
        // dans l'archive, il est déjà couvert par la page du classement.
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [year, month] = currentMonth.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1 - 3, 15));
        prismaMock.score.findFirst.mockResolvedValue({ dayKey: start.toISOString().slice(0, 10) });

        const archive = (await sitemap()).filter((entry) => entry.url.includes('?'));

        expect(archive).toHaveLength(3 * LOCALES.length);
        // Le paramètre est traduit comme les slugs : `mois` en français,
        // `month` en anglais. Une URL anglaise portant `?mois=` serait une
        // page inexistante déclarée aux moteurs.
        expect(archive.filter((e) => e.url.includes('/classement?mois='))).toHaveLength(3);
        expect(archive.filter((e) => e.url.includes('/en/leaderboard?month='))).toHaveLength(3);
    });

    it('n’expose aucun mois quand la base est vide', async () => {
        prismaMock.score.findFirst.mockResolvedValue(null);
        expect(await sitemap()).toHaveLength(STATIC_COUNT);
    });

    it('n’expose aucun mois quand le seul score est du mois courant', async () => {
        // Sinon on déclarerait une archive qui n'existe pas encore.
        prismaMock.score.findFirst.mockResolvedValue({ dayKey: new Date().toISOString().slice(0, 10) });
        expect(await sitemap()).toHaveLength(STATIC_COUNT);
    });

    it('rend un plan complet quand la base est injoignable', async () => {
        // Le classement est un agrément : il ne doit pas emporter le sitemap
        // avec lui. C'est aussi ce qui permet au build Docker de tourner sans
        // base.
        prismaMock.score.findFirst.mockImplementation(async () => {
            throw new Error('base injoignable');
        });

        const entries = await sitemap();
        expect(entries).toHaveLength(STATIC_COUNT);
        expect(entries.every((entry) => entry.url.startsWith('https://'))).toBe(true);
    });

    it('rend un plan complet quand l’accès à la base lève de façon synchrone', async () => {
        // Cas réel et distinct du précédent : `prisma` est un mandataire qui
        // construit le client au premier accès et lève TOUT DE SUITE si
        // DATABASE_URL manque. Un `.catch()` sur la promesse ne verrait rien
        // passer — il n'y aurait pas de promesse.
        prismaMock.score.findFirst.mockImplementation(() => {
            throw new Error('DATABASE_URL est absent');
        });

        expect(await sitemap()).toHaveLength(STATIC_COUNT);
    });

    it('borne le nombre de mois si une date aberrante traîne en base', async () => {
        // Un `dayKey` de 1970 générerait des centaines d'URL vides.
        prismaMock.score.findFirst.mockResolvedValue({ dayKey: '1970-01-01' });

        const archive = (await sitemap()).filter((entry) => entry.url.includes('?'));
        expect(archive.length).toBeLessThanOrEqual(120 * LOCALES.length);
    });
});

describe('robots', () => {
    const rules = robots();

    it('autorise l’indexation et interdit l’API', () => {
        expect(rules.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/api/' });
    });

    it('renvoie vers le plan du site', () => {
        expect(rules.sitemap).toContain('/sitemap.xml');
    });
});
