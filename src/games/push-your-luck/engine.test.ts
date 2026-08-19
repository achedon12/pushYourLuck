import { describe, expect, it } from 'vitest';
import {
    createRun, draw, bank, chooseOffer, readDeck, bankMultiplier,
    MAX_LIVES, BANK_GROWTH, type RunState,
} from './engine';
import { STARTING_DECK } from './cards';

/** Avance jusqu'à ce que la condition soit vraie, ou jusqu'à la fin de partie. */
function drawUntil(state: RunState, predicate: (s: RunState) => boolean): RunState {
    let current = state;
    for (let i = 0; i < 500 && !predicate(current) && current.phase !== 'over'; i++) {
        current = current.phase === 'shop' ? chooseOffer(current, null) : draw(current);
    }
    return current;
}

describe('moteur de jeu', () => {
    it('démarre sur le paquet de départ, trois vies et un pot vide', () => {
        const run = createRun(1);
        expect(run.deck).toHaveLength(STARTING_DECK.length);
        expect(run.lives).toBe(MAX_LIVES);
        expect(run.pot).toBe(0);
        expect(run.phase).toBe('ready');
    });

    it('rend le même état pour une même graine', () => {
        expect(draw(draw(createRun(77)))).toEqual(draw(draw(createRun(77))));
    });

    it('retire une carte du paquet à chaque tirage', () => {
        const start = createRun(3);
        const after = draw(start);
        expect(after.deck).toHaveLength(start.deck.length - 1);
        expect(after.drawn).toHaveLength(1);
    });

    it('encaisser ajoute le pot au score et vide le pot', () => {
        const run = drawUntil(createRun(11), (s) => s.pot > 0);
        const banked = bank(run);
        expect(banked.score).toBeGreaterThan(0);
        expect(banked.pot).toBe(0);
    });

    it('encaisser retire DÉFINITIVEMENT les cartes tirées — la règle centrale', () => {
        const run = drawUntil(createRun(11), (s) => s.pot > 0 && s.drawn.length >= 2);
        const drawnCount = run.drawn.length;
        const banked = bank(run);

        expect(banked.removed).toHaveLength(drawnCount);
        expect(banked.deck).toHaveLength(run.deck.length);
        // Aucune bombe ne peut sortir du jeu par un encaissement : une manche
        // encaissée n'en contient jamais.
        expect(banked.removed).not.toContain('bomb');
    });

    it('une bombe coûte une vie, le pot, et REMET les cartes dans le paquet', () => {
        const run = drawUntil(createRun(4), (s) => s.drawn.includes('bomb') || s.lives < MAX_LIVES);
        expect(run.lives).toBeLessThan(MAX_LIVES);
        expect(run.pot).toBe(0);
        expect(run.drawn).toHaveLength(0);
        // Le paquet reprend tout ce qui avait été tiré, bombe comprise.
        expect(run.deck.filter((id) => id === 'bomb')).toHaveLength(5);
    });

    it('la partie se termine à court de vies', () => {
        let run = createRun(4);
        for (let i = 0; i < 400 && run.phase !== 'over'; i++) {
            run = run.phase === 'shop' ? chooseOffer(run, null) : draw(run);
        }
        expect(run.phase).toBe('over');
        expect(run.lives).toBe(0);
    });

    it('la prime d’enchaînement croît géométriquement', () => {
        expect(bankMultiplier(1)).toBe(1);
        expect(bankMultiplier(2)).toBeCloseTo(BANK_GROWTH, 10);
        expect(bankMultiplier(3)).toBeCloseTo(BANK_GROWTH ** 2, 10);
        // Croissance stricte : sans elle, pousser sa chance ne paie jamais.
        expect(bankMultiplier(6)).toBeGreaterThan(bankMultiplier(5));
    });

    it('applique la prime au moment d’encaisser', () => {
        const run = drawUntil(createRun(11), (s) => s.pot > 0 && s.drawn.length >= 3);
        const expected = Math.round(run.pot * bankMultiplier(run.drawn.length));
        expect(bank(run).score).toBe(expected);
    });

    it('renvoie l’état INCHANGÉ sur une action illégale', () => {
        const fresh = createRun(9);
        // Pot vide : encaisser n'a pas de sens.
        expect(bank(fresh)).toBe(fresh);
        // Hors phase boutique : choisir une offre non plus.
        expect(chooseOffer(fresh, 0)).toBe(fresh);
    });

    it('propose trois cartes en boutique après un encaissement', () => {
        const run = drawUntil(createRun(11), (s) => s.pot > 0);
        const banked = bank(run);
        expect(banked.phase).toBe('shop');
        expect(banked.offers).toHaveLength(3);
    });

    it('ajoute au paquet la carte choisie en boutique, rien si l’on passe', () => {
        const run = drawUntil(createRun(11), (s) => s.pot > 0);
        const banked = bank(run);

        expect(chooseOffer(banked, 0).deck).toHaveLength(banked.deck.length + 1);
        expect(chooseOffer(banked, null).deck).toHaveLength(banked.deck.length);
    });

    it('expose une probabilité de saut exacte', () => {
        const run = createRun(2);
        const { size, bombs, bustChance } = readDeck(run);
        expect(size).toBe(STARTING_DECK.length);
        expect(bombs).toBe(5);
        expect(bustChance).toBeCloseTo(5 / STARTING_DECK.length, 10);
    });
});
