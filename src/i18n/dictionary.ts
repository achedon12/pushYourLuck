import { fr } from './fr';
import { en } from './en';
import type { Locale } from './config';

/**
 * Élargit les types littéraux produits par `as const`.
 *
 * Sans ça, `typeof fr` imposerait à la traduction anglaise d'être MOT POUR MOT
 * le texte français. On veut vérifier la STRUCTURE — toutes les clés, au bon
 * endroit, du bon type — pas les valeurs.
 */
type Widen<T> = T extends string
    ? string
    : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof fr>;

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

export function dict(locale: Locale): Dictionary {
    return DICTIONARIES[locale];
}
