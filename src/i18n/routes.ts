import type { Locale } from './config';

/**
 * Table unique des URL. Les slugs sont traduits (`/regles` vs `/en/rules`) :
 * un mot-clé dans l'URL compte pour le référencement, et une URL anglaise
 * lisible inspire davantage confiance qu'un `/en/regles`.
 *
 * Tout lien interne et toute balise `hreflang` doivent passer par ici — c'est
 * ce qui garantit qu'aucune traduction ne pointe vers une page inexistante.
 */
export const ROUTES = {
    home: { fr: '/', en: '/en' },
    rules: { fr: '/regles', en: '/en/rules' },
    leaderboard: { fr: '/classement', en: '/en/leaderboard' },
    changelog: { fr: '/nouveautes', en: '/en/changelog' },
    legal: { fr: '/mentions-legales', en: '/en/legal-notice' },
    privacy: { fr: '/confidentialite', en: '/en/privacy' },
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Paramètre de navigation du calendrier, traduit comme les slugs. */
export const MONTH_PARAM: Record<Locale, string> = { fr: 'mois', en: 'month' };

export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

export function path(key: RouteKey, locale: Locale): string {
    return ROUTES[key][locale];
}

/** Toutes les traductions d'une page, pour les balises `hreflang`. */
export function alternates(key: RouteKey): Record<string, string> {
    return { fr: ROUTES[key].fr, en: ROUTES[key].en };
}
