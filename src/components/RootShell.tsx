import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { site, absoluteUrl } from '@/lib/site';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { dict } from '@/i18n/dictionary';
import { path } from '@/i18n/routes';
import { themeBootScript } from '@/components/ThemeToggle';
import { Matomo } from '@/components/Matomo';
import '@/app/globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

/**
 * Corps commun aux deux layouts racine (un par langue — voir les groupes de
 * routes `(fr)` et `(en)`). Deux layouts racine sont le seul moyen de faire
 * varier `<html lang>` sans préfixer les URL françaises ni passer par une
 * redirection.
 */
export function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
    const t = dict(locale);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': absoluteUrl('/#website'),
                url: site.url,
                name: site.name,
                description: t.site.description,
                inLanguage: HTML_LANG[locale],
                publisher: { '@id': absoluteUrl('/#person') },
            },
            {
                '@type': 'Person',
                '@id': absoluteUrl('/#person'),
                name: site.author.name,
                url: site.author.url,
            },
            {
                '@type': 'VideoGame',
                '@id': absoluteUrl('/#game'),
                name: site.name,
                description: t.site.description,
                url: absoluteUrl(path('home', locale)),
                inLanguage: HTML_LANG[locale],
                genre: ['Card game', 'Roguelite', 'Casual'],
                playMode: 'SinglePlayer',
                gamePlatform: 'Web browser',
                applicationCategory: 'GameApplication',
                operatingSystem: 'Any modern browser',
                author: { '@id': absoluteUrl('/#person') },
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'EUR',
                    availability: 'https://schema.org/InStock',
                },
            },
        ],
    };

    // `suppressHydrationWarning` est indispensable ici, et seulement ici : le
    // script de thème pose `data-theme` sur <html> avant l'hydratation, donc
    // l'attribut diffère forcément du HTML rendu par le serveur.
    return (
        <html
            lang={HTML_LANG[locale]}
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col">
        {/* Doit rester le tout premier nœud du body : il applique le thème
            choisi avant que quoi que ce soit ne soit peint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
            {t.nav.skipToContent}
        </a>
        {children}
        <Matomo />
        </body>
        </html>
    );
}
