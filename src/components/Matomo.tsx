'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MATOMO_SITE_ID, isAnalyticsConfigured, trackerBase, trackPageView } from '@/lib/analytics';

/**
 * Charge Matomo et suit les changements de page.
 *
 * Le routeur applicatif ne recharge pas le document d'une page à l'autre : sans
 * ce suivi manuel, Matomo ne verrait que la première page de chaque visite.
 */
export function Matomo() {
    const pathname = usePathname();
    const loaded = useRef(false);
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (!isAnalyticsConfigured()) return;

        if (!loaded.current) {
            loaded.current = true;
            const base = trackerBase();
            const w = window as Window & { _paq?: unknown[][] };
            w._paq = w._paq ?? [];
            // `disableCookies` AVANT toute autre commande : posé après, un cookie
            // aurait déjà pu être écrit, et l'exemption de consentement tomberait.
            w._paq.push(['disableCookies']);
            w._paq.push(['enableLinkTracking']);
            w._paq.push(['setTrackerUrl', `${base}matomo.php`]);
            w._paq.push(['setSiteId', MATOMO_SITE_ID]);

            const script = document.createElement('script');
            script.async = true;
            script.src = `${base}matomo.js`;
            document.head.appendChild(script);
        }

        if (pathname !== lastPath.current) {
            lastPath.current = pathname;
            trackPageView(window.location.href, document.title);
        }
    }, [pathname]);

    return null;
}
