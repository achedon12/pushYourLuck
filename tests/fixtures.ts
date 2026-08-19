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

export const FIXTURE_PLAYERS = [
    { name: 'Amandine', score: 214, rounds: 9 },
    { name: 'Boris', score: 158, rounds: 6 },
    { name: 'Camille', score: 77, rounds: 4 },
];

export const FIXTURE_PREVIOUS_MONTH = { name: 'Damien', score: 133, rounds: 5 };

/** Réinitialise la base de test dans un processus séparé. */
export function seedTestDatabase(): void {
    execFileSync('npx', ['tsx', 'scripts/seed-test-db.ts'], {
        stdio: 'pipe',
        env: { ...process.env, TEST_DATABASE_URL },
    });
}
