import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { LOCALES } from '@/i18n/config';
import { ROUTE_KEYS, path, alternates } from '@/i18n/routes';
import { CHANGELOG } from '@/content/changelog';

/**
 * Chaque URL déclare ses traductions via `alternates.languages`. Sans ça, les
 * deux versions d'une page se concurrencent au lieu de se compléter.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    // Le classement bouge tous les jours, le reste ne bouge qu'à une nouvelle
    // version : dater toutes les pages de « maintenant » à chaque build est un
    // signal faux, que les moteurs finissent par ignorer.
    const now = new Date();
    const released = new Date(`${CHANGELOG[0].date}T00:00:00Z`);

    const priority: Record<string, number> = {
        home: 1, leaderboard: 0.8, rules: 0.7, changelog: 0.5, legal: 0.3, privacy: 0.3,
    };
    const frequency: Record<string, 'daily' | 'weekly' | 'monthly' | 'yearly'> = {
        home: 'daily', leaderboard: 'daily', rules: 'monthly',
        changelog: 'weekly', legal: 'yearly', privacy: 'yearly',
    };

    return LOCALES.flatMap((locale) =>
        ROUTE_KEYS.map((key) => {
            const languages = alternates(key);
            return {
                url: absoluteUrl(path(key, locale)),
                lastModified: key === 'leaderboard' ? now : released,
                changeFrequency: frequency[key],
                priority: priority[key],
                alternates: {
                    languages: {
                        fr: absoluteUrl(languages.fr),
                        en: absoluteUrl(languages.en),
                        'x-default': absoluteUrl(languages.fr),
                    },
                },
            };
        }),
    );
}
