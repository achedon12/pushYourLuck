/**
 * Simulation headless — l'outil d'équilibrage du jeu.
 *
 * Le moteur étant pur et déterministe, on peut faire jouer des milliers de
 * parties par un bot en quelques secondes et lire l'effet réel d'un changement
 * de nombres dans cards.ts, au lieu de jouer 300 parties à la main.
 *
 *   node scripts/simulate.ts [nbParties]
 */
import { createRun, draw, bank, chooseOffer, readDeck, type RunState } from '../src/games/push-your-luck/engine';
import { CARDS } from '../src/games/push-your-luck/cards';

/** Bot : encaisse dès que le risque du prochain tirage dépasse `threshold`. */
function play(seed: number, threshold: number): RunState {
    let s = createRun(seed);
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 5000) {
        if (s.phase === 'shop') {
            // Choisit l'offre de plus forte valeur faciale, en évitant le Va-tout.
            let best = 0;
            s.offers.forEach((id, i) => {
                if (id !== 'greed' && CARDS[id].value > CARDS[s.offers[best]].value) best = i;
            });
            s = chooseOffer(s, best);
            continue;
        }
        const { bustChance } = readDeck(s);
        if (s.pot > 0 && bustChance > threshold) s = bank(s);
        else s = draw(s);
    }
    return s;
}

/** Bot alternatif : vise `target` cartes dans la manche, puis encaisse. */
function playFixed(seed: number, target: number): RunState {
    let s = createRun(seed);
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 5000) {
        if (s.phase === 'shop') {
            let best = 0;
            s.offers.forEach((id, i) => {
                if (id !== 'greed' && CARDS[id].value > CARDS[s.offers[best]].value) best = i;
            });
            s = chooseOffer(s, best);
            continue;
        }
        if (s.pot > 0 && s.drawn.length >= target) s = bank(s);
        else s = draw(s);
    }
    return s;
}

function report(label: string, scores: number[], rounds: number, runs: number) {
    scores.sort((a, b) => a - b);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(
        label.padEnd(8) +
        avg.toFixed(1).padStart(7) +
        String(scores[Math.floor(scores.length / 2)]).padStart(10) +
        String(scores[Math.floor(scores.length * 0.9)]).padStart(7) +
        String(scores[scores.length - 1]).padStart(7) +
        (rounds / runs).toFixed(1).padStart(11),
    );
}

const runs = Number(process.argv[2] ?? 3000);
console.log(`${runs} parties par seuil\n`);
console.log('seuil   moyenne   médiane   p90    max    manches');
console.log('─'.repeat(52));

for (const threshold of [0.15, 0.2, 0.25, 0.3, 0.4]) {
    const scores: number[] = [];
    let rounds = 0;
    for (let i = 0; i < runs; i++) {
        const s = play(i * 2654435761, threshold);
        scores.push(s.score);
        rounds += s.round;
    }
    report('risque>' + threshold, scores, rounds, runs);
}

console.log('\n« pousser jusqu\'à N cartes puis encaisser »');
console.log('N       moyenne   médiane   p90    max    manches');
console.log('─'.repeat(52));
for (const target of [1, 2, 3, 4, 5, 6, 8, 10]) {
    const scores: number[] = [];
    let rounds = 0;
    for (let i = 0; i < runs; i++) {
        const s = playFixed(i * 2654435761, target);
        scores.push(s.score);
        rounds += s.round;
    }
    report(String(target), scores, rounds, runs);
}
