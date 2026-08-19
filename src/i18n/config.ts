export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Le français n'est pas préfixé dans les URL (`/regles`), l'anglais l'est
 * (`/en/rules`). C'est la stratégie « préfixe au besoin » : elle garde la page
 * d'accueil du domaine à la racine — donc pas de redirection sur l'URL la plus
 * visitée — tout en donnant à chaque langue ses propres adresses indexables.
 */
export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_LABELS: Record<Locale, string> = { fr: 'Français', en: 'English' };
export const HTML_LANG: Record<Locale, string> = { fr: 'fr-FR', en: 'en' };
