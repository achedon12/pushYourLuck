import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { LOCALES, type Locale } from '@/i18n/config';
import { ROUTE_KEYS, path, alternates, MONTH_PARAM, type RouteKey } from '@/i18n/routes';
import { CHANGELOG } from '@/content/changelog';
import { prisma } from '@/lib/prisma';
import { dayKey } from '@/lib/daily';
import { shiftMonth } from '@/lib/months';

const GAME = 'push-your-luck';

/**
 * Le sitemap énumère les mois d'archive, donc il interroge la base : il est
 * rendu à la demande, comme la page du classement elle-même. Le calculer à la
 * construction le figerait sur les mois connus ce jour-là — et le build Docker
 * tourne de toute façon sans base joignable.
 */
export const dynamic = 'force-dynamic';

/**
 * Plafond de mois exposés. Google recommande de rester sous 50 000 URL par
 * fichier ; on est très loin du compte, mais une borne évite qu'une donnée
 * aberrante en base (un `dayKey` de 1970) ne fasse générer des milliers d'URL
 * vides.
 */
const MAX_ARCHIVE_MONTHS = 120;

/** Poids éditorial des pages fixes. Une seule table, pour qu'aucune ne dérive. */
const STATIC_ROUTES: Record<RouteKey, { priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = {
    home: { priority: 1, changeFrequency: 'daily' },
    leaderboard: { priority: 0.8, changeFrequency: 'daily' },
    rules: { priority: 0.7, changeFrequency: 'monthly' },
    changelog: { priority: 0.5, changeFrequency: 'weekly' },
    legal: { priority: 0.3, changeFrequency: 'yearly' },
    privacy: { priority: 0.3, changeFrequency: 'yearly' },
};

/** URL d'un mois d'archive, dans la langue demandée (le paramètre est traduit). */
function monthUrl(locale: Locale, month: string): string {
    return absoluteUrl(`${path('leaderboard', locale)}?${MONTH_PARAM[locale]}=${month}`);
}

/**
 * Mois réellement jouables, du plus ancien score au mois courant.
 *
 * Défensif comme le reste des lectures Prisma du projet : base injoignable =
 * aucun mois d'archive, jamais une erreur. Le sitemap perd des URL, il ne
 * disparaît pas.
 */
async function archiveMonths(currentMonth: string): Promise<string[]> {
    // `try/catch` et non `.catch()` : `prisma` est un mandataire qui construit
    // le client au premier accès et lève de façon SYNCHRONE quand la
    // configuration manque. Un `.catch()` ne serait jamais attaché dans ce
    // cas-là, et le sitemap entier partirait en 500 — précisément la situation
    // d'un conteneur démarré sans DATABASE_URL.
    let oldest: { dayKey: string } | null = null;
    try {
        oldest = await prisma.score.findFirst({
            where: { game: GAME, mode: 'daily' },
            orderBy: { dayKey: 'asc' },
            select: { dayKey: true },
        });
    } catch {
        return [];
    }

    const firstMonth = oldest?.dayKey?.slice(0, 7);
    if (!firstMonth || firstMonth >= currentMonth) return [];

    const months: string[] = [];
    let month = firstMonth;
    while (month < currentMonth && months.length < MAX_ARCHIVE_MONTHS) {
        months.push(month);
        month = shiftMonth(month, 1);
    }
    return months;
}

/**
 * Chaque URL déclare ses traductions via `alternates.languages`. Sans ça, les
 * deux versions d'une page se concurrencent au lieu de se compléter.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Dater toutes les pages de « maintenant » à chaque rendu est un signal
    // faux, que les moteurs finissent par ignorer. Le classement bouge chaque
    // jour ; le reste ne bouge qu'à une nouvelle version.
    const now = new Date();
    const released = new Date(`${CHANGELOG[0].date}T00:00:00Z`);
    const currentMonth = dayKey().slice(0, 7);

    const staticEntries = LOCALES.flatMap((locale) =>
        ROUTE_KEYS.map((key) => {
            const languages = alternates(key);
            return {
                url: absoluteUrl(path(key, locale)),
                lastModified: key === 'leaderboard' ? now : released,
                changeFrequency: STATIC_ROUTES[key].changeFrequency,
                priority: STATIC_ROUTES[key].priority,
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

    // Un mois d'archive est une page à part entière : son classement, son
    // calendrier, ses noms. Ces URL sont liées depuis la navigation du
    // calendrier, donc explorées de toute façon — les déclarer évite qu'elles
    // ne soient découvertes au hasard des liens, et leur donne une date.
    //
    // Un mois clos ne bouge plus : `yearly`, daté de son dernier jour. C'est ce
    // qui distingue l'archive de la page courante, remise à jour chaque jour.
    const months = await archiveMonths(currentMonth);
    const archiveEntries = months.flatMap((month) =>
        LOCALES.map((locale) => ({
            url: monthUrl(locale, month),
            lastModified: new Date(`${shiftMonth(month, 1)}-01T00:00:00Z`),
            changeFrequency: 'yearly' as const,
            priority: 0.4,
            alternates: {
                languages: {
                    fr: monthUrl('fr', month),
                    en: monthUrl('en', month),
                    'x-default': monthUrl('fr', month),
                },
            },
        })),
    );

    return [...staticEntries, ...archiveEntries];
}
