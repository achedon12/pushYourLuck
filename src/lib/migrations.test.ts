import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Le schéma de production n'est plus posé par `db push` mais par les
 * migrations : ce sont ces fichiers-là, et eux seuls, qui décrivent la base
 * réellement déployée. Ils méritent donc les mêmes garde-fous que le code.
 *
 * Ces tests ne touchent aucune base — ils lisent le SQL versionné. La
 * vérification « ça s'applique vraiment » est faite ailleurs, et mieux : la
 * base de test est reposée à neuf puis migrée avant chaque suite fonctionnelle
 * (`scripts/setup-test-db.sh`), donc les 55 tests Playwright tournent sur un
 * schéma construit par ces migrations.
 */
const MIGRATIONS_DIR = new URL('../../prisma/migrations/', import.meta.url);
const SCHEMA = new URL('../../prisma/schema.prisma', import.meta.url);

const migrationDirs = () =>
    readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

const migrationSql = (name: string) =>
    readFileSync(new URL(`${name}/migration.sql`, MIGRATIONS_DIR), 'utf8');

describe('migrations', () => {
    it('en versionne au moins une, et aucune vide', () => {
        // Un dossier vide passerait `migrate deploy` sans erreur en laissant la
        // base sans table : exactement la panne rencontrée en production.
        const dirs = migrationDirs();
        expect(dirs.length).toBeGreaterThan(0);

        for (const dir of dirs) {
            expect(migrationSql(dir).trim(), `migration vide : ${dir}`).not.toBe('');
        }
    });

    it('crée la table des scores', () => {
        expect(migrationSql('0_init')).toContain('CREATE TABLE `Score`');
    });

    it('pose la contrainte qui borne un joueur à un score quotidien', () => {
        // Sans cet index UNIQUE, un joueur peut empiler autant de scores
        // quotidiens qu'il veut : la contrainte n'est pas un détail de schéma,
        // c'est la règle du classement. Une migration régénérée à la main qui
        // la perdrait ne se verrait qu'une fois le classement pollué.
        const sql = migrationSql('0_init');
        expect(sql).toContain('UNIQUE INDEX');
        for (const column of ['game', 'mode', 'dayKey', 'clientId']) {
            expect(sql).toMatch(new RegExp(`UNIQUE INDEX[^;]*\`${column}\``));
        }
    });

    it('décrit toutes les colonnes que le modèle Prisma déclare', () => {
        // Garde-fou contre la dérive : ajouter un champ au schéma sans générer
        // la migration correspondante compile, passe les tests unitaires, et
        // ne casse qu'en production sur un « Unknown column ».
        const schema = readFileSync(SCHEMA, 'utf8');
        const model = schema.match(/model Score \{([^}]*)\}/)?.[1];
        expect(model).toBeDefined();

        const fields = model!
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '' && !line.startsWith('//') && !line.startsWith('@@'))
            .map((line) => line.split(/\s+/)[0]);
        expect(fields).toContain('score');

        const allSql = migrationDirs().map(migrationSql).join('\n');
        for (const field of fields) {
            expect(allSql, `colonne absente des migrations : ${field}`).toContain(`\`${field}\``);
        }
    });
});
