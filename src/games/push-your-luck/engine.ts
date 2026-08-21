/**
 * Moteur de Push Your Luck — pur, déterministe, sans dépendance au DOM.
 *
 * Aucune fonction ici ne mute son entrée : chaque action renvoie un nouvel
 * état. C'est ce qui rend le moteur simulable en masse (voir scripts/simulate.ts)
 * et rejouable à l'identique à partir d'une graine.
 *
 * ── La règle qui fait le jeu ────────────────────────────────────────────────
 * Encaisser retire DÉFINITIVEMENT du paquet les cartes tirées pendant la
 * manche. Comme une manche ne se termine par un encaissement que si aucune
 * bombe n'est sortie, on ne retire jamais que des bonnes cartes : la densité de
 * bombes monte à chaque encaissement. Sauter, à l'inverse, remet tout dans le
 * paquet. Le joueur n'arbitre donc pas seulement « je tire encore ? » mais
 * « combien de fois puis-je encore me permettre d'encaisser ? ».
 */
import { CARDS, STARTING_DECK, SHOP_POOL } from './cards';
import { shuffle, nextInt } from './rng';

export const MAX_LIVES = 3;
export const SHOP_OFFERS = 3;

/**
 * Prime d'enchaînement appliquée au pot AU MOMENT D'ENCAISSER, fonction du
 * nombre de cartes tirées dans la manche.
 *
 * Sans elle le jeu est mort : la simulation headless montre qu'encaisser dès la
 * première carte domine toutes les autres stratégies — même gain moyen par
 * carte, zéro risque. C'est cette prime qui crée la seule décision qui compte :
 * une carte de plus vaut +22 % sur tout le pot, mais expose l'intégralité du
 * pot à la bombe.
 *
 * La croissance est géométrique et non linéaire : le risque se cumule lui aussi
 * géométriquement (~0,8^n de survie), donc une prime linéaire se fait toujours
 * rattraper. 1,22 est la valeur trouvée au balayage (scripts/simulate.ts) : de
 * 1 à 5 cartes les gains moyens sont plats à ~5 % près, donc aucune profondeur
 * fixe ne domine et la décision reste situationnelle. Plus haut (1,30+),
 * « pousser toujours » gagne ; plus bas (1,18-), pousser ne paie plus jamais.
 */
export const BANK_GROWTH = 1.22;

export function bankMultiplier(drawnCount: number): number {
    return Math.pow(BANK_GROWTH, Math.max(0, drawnCount - 1));
}

export type Phase = 'ready' | 'round' | 'shop' | 'over';

export interface RunState {
    seed: number;
    rng: number;
    /** Pioche restante, ordonnée : l'index 0 est le dessus du paquet. */
    deck: string[];
    /** Cartes tirées depuis le début de la manche courante. */
    drawn: string[];
    /** Cartes sorties définitivement du jeu (encaissées ou désamorcées). */
    removed: string[];
    pot: number;
    score: number;
    lives: number;
    round: number;
    phase: Phase;
    /** Assurance active : une bombe ne coûtera que la moitié du pot. */
    insured: boolean;
    /** Nombre de cartes du dessus actuellement visibles (Sonar). */
    revealed: number;
    /**
     * Vrai tant que la carte du dessus est garantie payante — uniquement au
     * tout premier tirage d'une partie (voir `openOnGain`). `readDeck` s'y fie
     * pour afficher 0 % : la jauge de risque promet une probabilité réelle,
     * elle ne doit pas annoncer un danger qui ne peut pas se produire.
     */
    safeTop: boolean;
    /** Propositions de la boutique en phase `shop`. */
    offers: string[];
    /** Dernière carte retournée — l'UI l'anime. */
    lastCard: string | null;
    /** Événements produits par la dernière action, consommés par l'UI. */
    events: GameEvent[];
}

export type GameEvent =
    | { type: 'gain'; amount: number }
    | { type: 'multiply'; factor: number }
    | { type: 'bomb'; saved: number }
    | { type: 'defuse' }
    | { type: 'reveal'; count: number }
    | { type: 'insure' }
    | { type: 'bank'; amount: number; removed: number }
    | { type: 'deck-cleared' }
    | { type: 'game-over'; score: number };

/* ------------------------------------------------------------------ */
/* Création                                                            */
/* ------------------------------------------------------------------ */

/**
 * Remonte un gain sûr sur le dessus du paquet.
 *
 * Sans ça une partie sur cinq s'ouvre sur une bombe : le joueur perd une vie
 * avant d'avoir pris la moindre décision, et comme la partie du jour est la
 * même pour tout le monde, ce mauvais tirage est infligé à tous les joueurs le
 * même jour. On échange la carte du dessus avec le premier gain rencontré :
 * la composition du paquet est intacte, l'échange reste déterministe (donc
 * rejouable côté serveur), seul l'ordre change.
 *
 * Un ×2 ne ferait pas l'affaire comme carte d'ouverture : sur un pot vide il
 * vaut zéro, et une première carte muette se lit comme un bug.
 */
function openOnGain(deck: string[]): string[] {
    const i = deck.findIndex((id) => CARDS[id].effect === 'gain' && CARDS[id].value > 0);
    if (i <= 0) return deck;
    const out = deck.slice();
    [out[0], out[i]] = [out[i], out[0]];
    return out;
}

export function createRun(seed: number): RunState {
    const [shuffled, rng] = shuffle(STARTING_DECK, seed);
    return {
        seed,
        rng,
        deck: openOnGain(shuffled),
        drawn: [],
        removed: [],
        pot: 0,
        score: 0,
        lives: MAX_LIVES,
        round: 1,
        phase: 'ready',
        insured: false,
        revealed: 0,
        safeTop: true,
        offers: [],
        lastCard: null,
        events: [],
    };
}

/* ------------------------------------------------------------------ */
/* Table d'effets — un effet = une entrée, jamais un `if` dans le moteur */
/* ------------------------------------------------------------------ */

type EffectResult = { state: RunState; busted: boolean };

const EFFECTS: Record<string, (s: RunState, value: number) => EffectResult> = {
    gain: (s, value) => {
        s.pot += value;
        s.events.push({ type: 'gain', amount: value });
        return { state: s, busted: false };
    },

    multiply: (s, value) => {
        const before = s.pot;
        s.pot = Math.round(s.pot * value);
        s.events.push({ type: 'multiply', factor: value });
        // Multiplier un pot vide ne rapporte rien : on le signale par le gain nul
        // plutôt que par une carte muette, sinon le joueur croit à un bug.
        if (before === 0) s.events.push({ type: 'gain', amount: 0 });
        return { state: s, busted: false };
    },

    scale: (s, value) => {
        // `drawn` contient déjà l'Aimant lui-même : on ne compte que les cartes
        // qui la précèdent.
        const amount = value * Math.max(0, s.drawn.length - 1);
        s.pot += amount;
        s.events.push({ type: 'gain', amount });
        return { state: s, busted: false };
    },

    greed: (s, value) => {
        s.pot += value;
        s.deck.push('bomb');
        const [deck, rng] = shuffle(s.deck, s.rng);
        s.deck = deck;
        s.rng = rng;
        s.events.push({ type: 'gain', amount: value });
        return { state: s, busted: false };
    },

    defuse: (s) => {
        const i = s.deck.indexOf('bomb');
        if (i >= 0) {
            s.deck.splice(i, 1);
            s.removed.push('bomb');
            s.events.push({ type: 'defuse' });
        }
        return { state: s, busted: false };
    },

    reveal: (s, value) => {
        s.revealed = Math.min(s.deck.length, value);
        s.events.push({ type: 'reveal', count: s.revealed });
        return { state: s, busted: false };
    },

    insure: (s) => {
        s.insured = true;
        s.events.push({ type: 'insure' });
        return { state: s, busted: false };
    },

    bomb: (s) => {
        const saved = s.insured ? Math.floor(s.pot / 2) : 0;
        s.score += saved;
        s.lives -= 1;
        s.events.push({ type: 'bomb', saved });
        return { state: s, busted: true };
    },
};

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/** Retourne la carte du dessus et applique son effet. */
export function draw(prev: RunState): RunState {
    if (prev.phase !== 'ready' && prev.phase !== 'round') return prev;
    if (prev.deck.length === 0) return clearDeck(prev);

    const s = clone(prev);
    s.events = [];
    s.phase = 'round';

    const id = s.deck.shift() as string;
    s.drawn.push(id);
    s.lastCard = id;
    s.revealed = Math.max(0, s.revealed - 1);
    s.safeTop = false;

    const def = CARDS[id];
    const { busted } = EFFECTS[def.effect](s, def.value);

    if (busted) return endRoundOnBust(s);
    if (s.deck.length === 0) return clearDeck(s);
    return s;
}

/** Sécurise le pot. Les cartes tirées quittent le paquet pour de bon. */
export function bank(prev: RunState): RunState {
    if (prev.phase !== 'round' || prev.pot <= 0) return prev;

    const s = clone(prev);
    const amount = Math.round(s.pot * bankMultiplier(s.drawn.length));
    s.events = [{ type: 'bank', amount, removed: s.drawn.length }];
    s.score += amount;
    s.removed.push(...s.drawn);
    s.pot = 0;
    s.drawn = [];
    s.insured = false;
    s.revealed = 0;
    s.lastCard = null;
    s.round += 1;

    if (s.deck.length === 0) return clearDeck(s);

    s.offers = pickOffers(s);
    s.phase = 'shop';
    return s;
}

/** Choisit une carte de boutique (`index`) ou passe (`null`). */
export function chooseOffer(prev: RunState, index: number | null): RunState {
    if (prev.phase !== 'shop') return prev;

    const s = clone(prev);
    s.events = [];
    if (index !== null && s.offers[index]) s.deck.push(s.offers[index]);

    const [deck, rng] = shuffle(s.deck, s.rng);
    s.deck = deck;
    s.rng = rng;
    s.offers = [];
    s.phase = 'ready';
    return s;
}

/* ------------------------------------------------------------------ */
/* Transitions internes                                                */
/* ------------------------------------------------------------------ */

function endRoundOnBust(s: RunState): RunState {
    // Rien n'est retiré : tout ce qui a été tiré retourne au paquet. Sauter
    // coûte le pot mais préserve la richesse de la pioche.
    s.deck.push(...s.drawn);
    const [deck, rng] = shuffle(s.deck, s.rng);
    s.deck = deck;
    s.rng = rng;

    s.drawn = [];
    s.pot = 0;
    s.insured = false;
    s.revealed = 0;
    s.round += 1;
    s.phase = s.lives <= 0 ? 'over' : 'ready';
    if (s.phase === 'over') s.events.push({ type: 'game-over', score: s.score });
    return s;
}

/** Paquet vidé : le joueur a tout nettoyé, la partie s'arrête sur son score. */
function clearDeck(prev: RunState): RunState {
    const s = clone(prev);
    s.score += s.pot;
    s.pot = 0;
    s.drawn = [];
    s.phase = 'over';
    s.events = [{ type: 'deck-cleared' }, { type: 'game-over', score: s.score }];
    return s;
}

function pickOffers(s: RunState): string[] {
    const pool = SHOP_POOL.slice();
    const out: string[] = [];
    for (let i = 0; i < SHOP_OFFERS && pool.length > 0; i++) {
        const [j, rng] = nextInt(s.rng, pool.length);
        s.rng = rng;
        out.push(pool.splice(j, 1)[0]);
    }
    return out;
}

function clone(s: RunState): RunState {
    return {
        ...s,
        deck: s.deck.slice(),
        drawn: s.drawn.slice(),
        removed: s.removed.slice(),
        offers: s.offers.slice(),
        events: [],
    };
}

/* ------------------------------------------------------------------ */
/* Lecture — l'information publique sur laquelle le joueur décide       */
/* ------------------------------------------------------------------ */

export interface DeckInsight {
    size: number;
    bombs: number;
    /** Probabilité exacte que le prochain tirage fasse sauter la manche. */
    bustChance: number;

    /** Composition restante, triée pour l'affichage. */
    composition: { id: string; count: number }[];
}

export function readDeck(s: RunState): DeckInsight {
    const counts = new Map<string, number>();
    for (const id of s.deck) counts.set(id, (counts.get(id) ?? 0) + 1);

    const bombs = counts.get('bomb') ?? 0;
    const composition = [...counts.entries()]
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => {
            const order = { danger: 0, boost: 1, tool: 2, gain: 3 };
            const d = order[CARDS[a.id].tone] - order[CARDS[b.id].tone];
            return d !== 0 ? d : CARDS[b.id].value - CARDS[a.id].value;
        });

    return {
        size: s.deck.length,
        bombs,
        bustChance: s.safeTop || !s.deck.length ? 0 : bombs / s.deck.length,
        composition,
    };
}
