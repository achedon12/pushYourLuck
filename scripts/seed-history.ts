/**
 * Remplit la base de DÉVELOPPEMENT avec un historique de scores fictifs.
 *
 * Le calendrier et sa navigation dans le temps sont invisibles tant qu'il n'y a
 * qu'une journée en base. Ce script n'a aucune raison d'être exécuté en
 * production : il crée des joueurs qui n'existent pas.
 *
 *   npm run seed:history [nombreDeMois]
 *
 * Pour tout effacer :
 *   DELETE FROM Score WHERE clientId LIKE 'seed-%';
 */
import { prisma } from '../src/lib/prisma';
import { dayKey } from '../src/lib/daily';
import { seedFromString, nextInt } from '../src/games/push-your-luck/rng';

const NAMES = ['Alice', 'Bruno', 'Chloe', 'Diane', 'Elias', 'Fanny', 'Gaspard', 'Hugo', 'Inès', 'Jules'];

async function main() {
    const months = Number(process.argv[2] ?? 4);
    const today = dayKey();
    const [year, month, day] = today.split('-').map(Number);

    const rows: { game: string; mode: string; dayKey: string; name: string; score: number; rounds: number; clientId: string }[] = [];

    for (let back = 0; back < months; back++) {
        const cursor = new Date(Date.UTC(year, month - 1 - back, 1));
        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth() + 1;
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const lastDay = back === 0 ? day - 1 : daysInMonth;

        for (let d = 1; d <= lastDay; d++) {
            const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let rng = seedFromString(`seed:${key}`);

            // Quelques jours sans aucun score : un calendrier entièrement rempli
            // ne montrerait pas la différence entre « pas de score » et « zéro ».
            const [skip, r1] = nextInt(rng, 10);
            rng = r1;
            if (skip === 0) continue;

            const [players, r2] = nextInt(rng, 4);
            rng = r2;

            for (let p = 0; p <= players; p++) {
                const [nameIndex, r3] = nextInt(rng, NAMES.length);
                rng = r3;
                const [score, r4] = nextInt(rng, 260);
                rng = r4;
                const [rounds, r5] = nextInt(rng, 14);
                rng = r5;

                rows.push({
                    game: 'push-your-luck',
                    mode: 'daily',
                    dayKey: key,
                    name: NAMES[nameIndex],
                    score,
                    rounds: rounds + 2,
                    clientId: `seed-${key}-${p}`,
                });
            }
        }
    }

    const created = await prisma.score.createMany({ data: rows, skipDuplicates: true });
    console.log(`${created.count} scores insérés sur ${months} mois`);
}

void main().finally(() => prisma.$disconnect());
