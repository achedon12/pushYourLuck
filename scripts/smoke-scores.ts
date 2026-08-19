/**
 * Vérification de bout en bout de la soumission de score sur un serveur local.
 *
 * Fait jouer trois bots à la partie du jour, envoie leurs suites d'actions, puis
 * tente une suite forgée qui doit être refusée. C'est le seul moyen de vérifier
 * que le rejeu côté serveur, la contrainte d'unicité et le classement tiennent
 * ensemble — le moteur seul ne le dit pas.
 *
 *   npm run smoke
 */
import { createRun, draw, bank, chooseOffer, readDeck } from '../src/games/push-your-luck/engine';
import { dailySeed } from '../src/lib/daily';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3001';

function botRun(seed: number, threshold: number) {
    let s = createRun(seed);
    let actions = '';
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 2000) {
        if (s.phase === 'shop') { s = chooseOffer(s, 0); actions += '0'; continue; }
        if (s.pot > 0 && readDeck(s).bustChance > threshold) { s = bank(s); actions += 'b'; }
        else { s = draw(s); actions += 'd'; }
    }
    return { actions, score: s.score };
}

async function post(body: unknown) {
    const res = await fetch(`${BASE}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.text() };
}

async function main() {
    const seed = dailySeed();
    for (const [name, threshold] of [['Alice', 0.2], ['Bruno', 0.26], ['Chloe', 0.32]] as const) {
        const run = botRun(seed, threshold);
        const res = await post({
            mode: 'daily', name, actions: run.actions,
            clientId: `smoke-${name.toLowerCase()}-000000001`,
        });
        console.log(`${name.padEnd(7)} moteur=${String(run.score).padStart(4)}  →  ${res.status} ${res.body}`);
    }

    const forged = await post({ mode: 'daily', name: 'Tricheur', actions: 'bbbbbb', clientId: 'smoke-cheat-000000001' });
    console.log(`forgé          →  ${forged.status} ${forged.body}`);

    const board = await fetch(`${BASE}/api/scores?mode=daily&limit=5`).then((r) => r.json());
    console.log('\nclassement :', board.scores);
}

void main();
