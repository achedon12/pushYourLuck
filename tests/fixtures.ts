import { execFileSync } from 'node:child_process';

/**
 * Constantes partagées par les tests fonctionnels et visuels.
 *
 * Ce fichier ne doit importer NI Prisma NI le code applicatif : il est chargé
 * par la configuration Playwright, évaluée en CommonJS, alors que le client
 * Prisma généré est un module ESM.
 */
export const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    'mysql://pushyourluck:pushyourluck@127.0.0.1:3307/pushyourluck_test';

/**
 * Origine que le navigateur poserait de lui-même sur un POST. La route des
 * scores refuse depuis peu les écritures qui ne viennent pas du site (403
 * `forbidden_origin`) : les appels d'API des tests doivent donc l'imiter.
 * Miroir volontaire de `BASE_URL` dans playwright.config.ts — ce fichier ne
 * peut pas l'importer, la configuration est évaluée en CommonJS.
 */
export const SITE_ORIGIN = `http://127.0.0.1:${process.env.TEST_PORT ?? 3002}`;

export const FIXTURE_PLAYERS = [
    { name: 'Amandine', score: 214, rounds: 9 },
    { name: 'Boris', score: 158, rounds: 6 },
    { name: 'Camille', score: 77, rounds: 4 },
];

export const FIXTURE_PREVIOUS_MONTH = { name: 'Damien', score: 133, rounds: 5 };

/**
 * Records de partie libre. Le même pseudo y figure DEUX fois, sous deux
 * identifiants de navigateur et deux graphies : c'est exactement la situation
 * que la page doit dédoublonner, l'unicité en base portant sur le `clientId` et
 * jamais sur le pseudo.
 */
export const FIXTURE_FREE_RECORDS = [
    { name: 'Achedon', score: 191, rounds: 7 },
    { name: 'achedon', score: 181, rounds: 6 },
    { name: 'Couzcouz', score: 164, rounds: 5 },
];

/** Réinitialise la base de test dans un processus séparé. */
export function seedTestDatabase(): void {
    execFileSync('npx', ['tsx', 'scripts/seed-test-db.ts'], {
        stdio: 'pipe',
        env: { ...process.env, TEST_DATABASE_URL },
    });
}
