/**
 * Repose la base de TEST à zéro et y écrit les fixtures.
 *
 * Exécuté dans son propre processus (via tsx) plutôt qu'importé par les tests :
 * le client Prisma généré est un module ESM, et Playwright charge sa
 * configuration en CommonJS. Le tenir hors du graphe de Playwright évite ce
 * conflit — et force les tests fonctionnels à passer par l'API de
 * l'application, ce qui est justement ce qu'ils doivent éprouver.
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { dayKey } from '../src/lib/daily';
import { FIXTURE_PLAYERS, FIXTURE_PREVIOUS_MONTH, TEST_DATABASE_URL } from '../tests/fixtures';

async function main() {
    if (!TEST_DATABASE_URL.includes('_test')) {
        // Garde-fou : ce script efface tout. Il ne doit jamais viser autre chose
        // que la base de test.
        throw new Error(`refus : la base visée n'est pas une base de test (${TEST_DATABASE_URL})`);
    }

    const prisma = new PrismaClient({ adapter: new PrismaMariaDb(TEST_DATABASE_URL) });
    try {
        await prisma.score.deleteMany({});

        const today = dayKey();
        const [year, month] = today.split('-').map(Number);

        await prisma.score.createMany({
            data: FIXTURE_PLAYERS.map((player, i) => ({
                game: 'push-your-luck',
                mode: 'daily',
                dayKey: today,
                name: player.name,
                score: player.score,
                rounds: player.rounds,
                clientId: `fixture-today-${i}`,
            })),
        });

        // Un mois antérieur, pour que la navigation du calendrier ait une borne
        // basse à atteindre et quelque chose à afficher.
        const previousKey = dayKey(new Date(Date.UTC(year, month - 2, 15)));
        await prisma.score.create({
            data: {
                game: 'push-your-luck',
                mode: 'daily',
                dayKey: previousKey,
                name: FIXTURE_PREVIOUS_MONTH.name,
                score: FIXTURE_PREVIOUS_MONTH.score,
                rounds: FIXTURE_PREVIOUS_MONTH.rounds,
                clientId: 'fixture-previous-0',
            },
        });

        console.log(`base de test réinitialisée : ${FIXTURE_PLAYERS.length + 1} scores`);
    } finally {
        await prisma.$disconnect();
    }
}

void main();
