/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 *
 * Tout l'aléatoire du jeu passe par ici, et son état vit DANS l'état de partie
 * plutôt que dans une variable de module. C'est ce qui permet trois choses :
 * la partie quotidienne identique pour tous les joueurs, le rejeu d'un bug à
 * partir de sa seule graine, et la simulation de milliers de parties en
 * headless pour équilibrer les cartes.
 */
export function nextRandom(state: number): [value: number, nextState: number] {
    const t = (state + 0x6d2b79f5) | 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return [((x ^ (x >>> 14)) >>> 0) / 4294967296, t];
}

/** Entier dans [0, max). */
export function nextInt(state: number, max: number): [value: number, nextState: number] {
    const [v, s] = nextRandom(state);
    return [Math.floor(v * max), s];
}

/** Fisher-Yates déterministe. Ne mute pas l'entrée. */
export function shuffle<T>(items: readonly T[], state: number): [shuffled: T[], nextState: number] {
    const out = items.slice();
    let s = state;
    for (let i = out.length - 1; i > 0; i--) {
        const [j, ns] = nextInt(s, i + 1);
        s = ns;
        [out[i], out[j]] = [out[j], out[i]];
    }
    return [out, s];
}

/** Graine entière à partir d'une chaîne (xfnv1a) — sert pour la partie du jour. */
export function seedFromString(input: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
