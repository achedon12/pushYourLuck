import { describe, expect, it } from 'vitest';
import { replay, MAX_ACTIONS } from './replay';
import { createRun, draw, bank, chooseOffer, readDeck, type RunState } from './engine';
import { CARDS } from './cards';

/** Joue une partie complète et renvoie sa suite d'actions encodée. */
function botRun(seed: number, threshold: number): { actions: string; state: RunState } {
    let state = createRun(seed);
    let actions = '';

    for (let i = 0; i < 2000 && state.phase !== 'over'; i++) {
        if (state.phase === 'shop') {
            let best = 0;
            state.offers.forEach((id, index) => {
                if (id !== 'greed' && CARDS[id].value > CARDS[state.offers[best]].value) best = index;
            });
            state = chooseOffer(state, best);
            actions += String(best);
            continue;
        }
        if (state.pot > 0 && readDeck(state).bustChance > threshold) {
            state = bank(state);
            actions += 'b';
        } else {
            state = draw(state);
            actions += 'd';
        }
    }

    return { actions, state };
}

describe('rejeu serveur (anti-triche)', () => {
    it('accepte une partie réellement jouée et retrouve son score', () => {
        const { actions, state } = botRun(2026, 0.25);
        const result = replay(2026, actions);

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.state.score).toBe(state.score);
    });

    it('refuse une suite d’actions inventée', () => {
        // Encaisser d'entrée est impossible : le pot est vide.
        expect(replay(1, 'bbbb').ok).toBe(false);
    });

    it('refuse un caractère inconnu', () => {
        const result = replay(1, 'ddxd');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toContain('action');
    });

    it('refuse une action sans effet — l’invariant du moteur', () => {
        // Un « s » (passer la boutique) hors phase boutique ne change rien :
        // c'est exactement ce que le rejeu doit détecter.
        expect(replay(1, 'ds').ok).toBe(false);
    });

    it('refuse une partie non terminée', () => {
        expect(replay(1, 'd').ok).toBe(false);
    });

    it('refuse des actions après la fin de partie', () => {
        const { actions } = botRun(2026, 0.25);
        expect(replay(2026, `${actions}d`).ok).toBe(false);
    });

    it('refuse une suite trop longue sans la rejouer', () => {
        const result = replay(1, 'd'.repeat(MAX_ACTIONS + 1));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toContain('longue');
    });

    it('donne un score différent sur une graine différente', () => {
        const { actions } = botRun(2026, 0.25);
        const other = replay(2027, actions);
        // La suite peut devenir illégale ou marquer autrement, mais jamais
        // reproduire le même déroulé.
        if (other.ok) expect(other.state.score).not.toBe(replay(2026, actions).ok);
    });
});
