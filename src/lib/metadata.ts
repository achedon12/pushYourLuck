import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path, alternates, type RouteKey } from '@/i18n/routes';

/**
 * Métadonnées d'une page, langue comprise.
 *
 * Tout passe par ici pour que la canonique et les `hreflang` restent cohérents :
 * chaque page déclare l'URL de TOUTES ses traductions, et pointe sa canonique
 * sur elle-même. C'est la paire que les moteurs attendent — une canonique sans
 * hreflang réciproque fait disparaître la version traduite des résultats.
 */
export function pageMetadata({
    locale,
    key,
    title,
    description,
}: {
    locale: Locale;
    key: RouteKey;
    title: string;
    description: string;
}): Metadata {
    const t = dict(locale);
    const url = path(key, locale);
    const languages = alternates(key);

    return {
        // Le titre d'accueil porte déjà le nom du site : lui appliquer le gabarit
        // « %s — Push Your Luck » le répéterait dans l'onglet et dans les
        // résultats de recherche.
        title: key === 'home' ? { absolute: title } : title,
        description,
        keywords: [...t.site.keywords],
        alternates: {
            canonical: url,
            languages: {
                ...languages,
                // `x-default` désigne la version servie à un visiteur dont la
                // langue n'est couverte par aucune traduction.
                'x-default': languages.fr,
            },
        },
        openGraph: {
            type: 'website',
            locale: HTML_LANG[locale].replace('-', '_'),
            url,
            siteName: site.name,
            title,
            description,
        },
        twitter: { card: 'summary_large_image', title, description },
    };
}

/**
 * Métadonnées communes aux deux layouts racine : elles ne dépendent que de la
 * langue et ne changent pas d'une page à l'autre.
 */
export function baseMetadata(locale: Locale): Metadata {
    const t = dict(locale);

    return {
        metadataBase: new URL(site.url),
        title: { default: `${site.name} — ${t.site.tagline}`, template: `%s — ${site.name}` },
        description: t.site.description,
        applicationName: site.name,
        authors: [{ name: site.author.name, url: site.author.url }],
        creator: site.author.name,
        publisher: site.author.name,
        category: 'game',
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
                'max-video-preview': -1,
            },
        },
        manifest: '/manifest.webmanifest',
        appleWebApp: { capable: true, title: site.name, statusBarStyle: 'black-translucent' },
        formatDetection: { telephone: false },
    };
}
