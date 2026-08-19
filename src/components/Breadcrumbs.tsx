import { absoluteUrl } from '@/lib/site';
import type { Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path, type RouteKey } from '@/i18n/routes';

/**
 * Fil d'Ariane structuré, sans rendu visible.
 *
 * Le site n'a que deux niveaux, donc un fil d'Ariane à l'écran n'apporterait
 * rien ; en revanche, il fait afficher « pushyourluck.net › Règles »
 * plutôt que l'URL brute dans les résultats de recherche.
 */
export function Breadcrumbs({ locale, routeKey, label }: { locale: Locale; routeKey: RouteKey; label: string }) {
    const t = dict(locale);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.site.name, item: absoluteUrl(path('home', locale)) },
            { '@type': 'ListItem', position: 2, name: label, item: absoluteUrl(path(routeKey, locale)) },
        ],
    };

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
