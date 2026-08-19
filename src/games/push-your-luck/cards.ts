/**
 * Catalogue de cartes — DONNÉES, pas classes.
 *
 * Une carte n'embarque aucune logique : elle déclare un `effect` que le moteur
 * résout via une table (voir engine.ts). C'est ce qui permet d'ajouter une
 * carte en ajoutant une ligne ici, et surtout d'équilibrer le jeu en changeant
 * des nombres plutôt que du code.
 *
 * Ni nom ni description ici : ce sont des textes, ils vivent dans les
 * dictionnaires (`i18n/fr.ts`, `i18n/en.ts`), sous la même clé que la carte.
 * Le moteur, lui, tourne aussi côté serveur et n'a que faire de la langue.
 */

export type EffectKind =
    | 'gain'        // ajoute `value` au pot
    | 'multiply'    // multiplie le pot par `value`
    | 'bomb'        // fait sauter la manche
    | 'defuse'      // retire définitivement une bombe de la pioche
    | 'reveal'      // révèle les `value` prochaines cartes
    | 'insure'      // en cas de bombe, la manche conserve la moitié du pot
    | 'greed'       // gros gain, mais ajoute une bombe à la pioche
    | 'scale';      // gain proportionnel au nombre de cartes déjà tirées

export type CardIconKey =
    | 'coin' | 'coins' | 'gem' | 'ingot' | 'crown'
    | 'double' | 'triple' | 'magnet'
    | 'bomb' | 'dice'
    | 'cutter' | 'radar' | 'shield';

export interface CardDef {
    id: string;
    effect: EffectKind;
    value: number;
    /** Pilote la couleur de la carte dans l'UI. */
    tone: 'gain' | 'boost' | 'danger' | 'tool';
    /**
     * Clé d'icône, résolue en composant Lucide par `components/game/cardIcons`.
     * On garde une chaîne ici : ce module est importé par le moteur, lui-même
     * exécuté côté serveur au rejeu des scores — il ne doit rien savoir de React.
     */
    icon: CardIconKey;
}

export const CARDS: Record<string, CardDef> = {
    coin1:  { id: 'coin1',  effect: 'gain',     value: 1,  tone: 'gain',   icon: 'coin' },
    coin2:  { id: 'coin2',  effect: 'gain',     value: 2,  tone: 'gain',   icon: 'coins' },
    coin3:  { id: 'coin3',  effect: 'gain',     value: 3,  tone: 'gain',   icon: 'coins' },
    coin5:  { id: 'coin5',  effect: 'gain',     value: 5,  tone: 'gain',   icon: 'gem' },
    coin8:  { id: 'coin8',  effect: 'gain',     value: 8,  tone: 'gain',   icon: 'ingot' },
    coin13: { id: 'coin13', effect: 'gain',     value: 13, tone: 'gain',   icon: 'crown' },

    x2:     { id: 'x2',     effect: 'multiply', value: 2,  tone: 'boost',  icon: 'double' },
    x3:     { id: 'x3',     effect: 'multiply', value: 3,  tone: 'boost',  icon: 'triple' },

    bomb:   { id: 'bomb',   effect: 'bomb',     value: 0,  tone: 'danger', icon: 'bomb' },

    defuse: { id: 'defuse', effect: 'defuse',   value: 1,  tone: 'tool',   icon: 'cutter' },
    sonar:  { id: 'sonar',  effect: 'reveal',   value: 3,  tone: 'tool',   icon: 'radar' },
    shield: { id: 'shield', effect: 'insure',   value: 0,  tone: 'tool',   icon: 'shield' },
    greed:  { id: 'greed',  effect: 'greed',    value: 18, tone: 'danger', icon: 'dice' },
    magnet: { id: 'magnet', effect: 'scale',    value: 2,  tone: 'boost',  icon: 'magnet' },
};

/**
 * Pioche de départ : 26 cartes dont 5 bombes (~19 % de risque au premier tirage).
 * Volontairement sans carte spéciale — la première manche doit s'expliquer en
 * cinq secondes ; la complexité arrive par la boutique.
 */
export const STARTING_DECK: readonly string[] = [
    ...Array(4).fill('coin1'),
    ...Array(4).fill('coin2'),
    ...Array(4).fill('coin3'),
    ...Array(3).fill('coin5'),
    ...Array(2).fill('coin8'),
    'coin13',
    ...Array(3).fill('x2'),
    ...Array(5).fill('bomb'),
];

/** Cartes proposées en boutique entre deux manches. */
export const SHOP_POOL: readonly string[] = [
    'coin5', 'coin8', 'coin13', 'x2', 'x3', 'defuse', 'sonar', 'shield', 'greed', 'magnet',
];
