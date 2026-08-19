import { createRun, draw, bank, chooseOffer, type RunState } from './engine';

/**
 * Rejoue une partie à partir de sa graine et de la suite d'actions du joueur.
 *
 * C'est la contrepartie utile du moteur déterministe : le serveur n'a pas à
 * croire le score annoncé par le navigateur, il le recalcule. Falsifier un
 * score demande alors de produire une suite d'actions qui marque réellement
 * autant — soit, pour la partie du jour, de résoudre le paquet du jour, ce qui
 * est exactement ce qu'on demande aux joueurs.
 *
 * Encodage, une action par caractère :
 *   d = tirer   b = encaisser   0/1/2 = prendre l'offre n   s = passer l'offre
 */
export const MAX_ACTIONS = 4000;

export type ReplayResult =
    | { ok: true; state: RunState }
    | { ok: false; reason: string };

export function replay(seed: number, actions: string): ReplayResult {
    if (actions.length > MAX_ACTIONS) return { ok: false, reason: 'partie trop longue' };
    if (!/^[db012s]*$/.test(actions)) return { ok: false, reason: 'action inconnue' };

    let state = createRun(seed);

    for (let i = 0; i < actions.length; i++) {
        const before = state;
        switch (actions[i]) {
            case 'd': state = draw(state); break;
            case 'b': state = bank(state); break;
            case 's': state = chooseOffer(state, null); break;
            default:  state = chooseOffer(state, Number(actions[i])); break;
        }
        // Les actions du moteur sont des no-op quand elles sont illégales dans
        // la phase courante. Une suite valide ne contient donc jamais de no-op :
        // en détecter un, c'est avoir affaire à une suite forgée au hasard.
        if (state === before) return { ok: false, reason: `action ${i + 1} impossible` };
        if (state.phase === 'over') {
            return i === actions.length - 1
                ? { ok: true, state }
                : { ok: false, reason: 'actions après la fin de partie' };
        }
    }

    return state.phase === 'over'
        ? { ok: true, state }
        : { ok: false, reason: 'partie non terminée' };
}
