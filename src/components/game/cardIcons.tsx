import {
    Bomb, Coins, CircleDollarSign, Gem, Landmark, Crown,
    Sparkle, Sparkles, Magnet, Scissors, Radar, ShieldCheck, Dices,
    type LucideIcon,
} from 'lucide-react';
import type { CardIconKey } from '@/games/push-your-luck/cards';

/**
 * Résolution clé → composant. Séparée de `cards.ts` pour que le catalogue reste
 * pur : il est importé par le moteur, qui tourne aussi côté serveur.
 */
export const CARD_ICONS: Record<CardIconKey, LucideIcon> = {
    coin: CircleDollarSign,
    coins: Coins,
    gem: Gem,
    ingot: Landmark,
    crown: Crown,
    double: Sparkle,
    triple: Sparkles,
    magnet: Magnet,
    bomb: Bomb,
    dice: Dices,
    cutter: Scissors,
    radar: Radar,
    shield: ShieldCheck,
};
