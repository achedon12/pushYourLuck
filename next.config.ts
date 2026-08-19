import type { NextConfig } from 'next';
import { version } from './package.json';

const nextConfig: NextConfig = {
    // Version exposée au pied de page. Elle est lue ici, à la construction :
    // importer package.json depuis un composant embarquerait le fichier entier
    // — dépendances comprises — dans le bundle envoyé au navigateur.
    env: { NEXT_PUBLIC_APP_VERSION: version },
    // Requis par le Dockerfile : le stage runner ne copie que `.next/standalone`.
    // Désactivé pour les tests, où l'application est servie par `next start` —
    // qui ignore cette sortie et le signale à chaque démarrage.
    output: process.env.NEXT_DISABLE_STANDALONE === '1' ? undefined : 'standalone',
    poweredByHeader: false,
    // Aucun `next/image` dans le projet : les seules images sont des PNG servis
    // tels quels et des SVG en ligne. Laisser l'optimiseur actif embarquait
    // `sharp` et ses binaires `@img` — 19 Mo — dans l'image de production, pour
    // une fonctionnalité jamais appelée.
    images: { unoptimized: true },
    // `sharp` est une dépendance de DÉVELOPPEMENT (export des logos), mais Next
    // la trace quand même : elle est présente dans node_modules au moment de la
    // construction. L'exclure explicitement retire 19 Mo de binaires `@img` de
    // l'image finale. Sans danger ici puisque `next/image` n'est jamais employé.
    outputFileTracingExcludes: {
        '*': ['node_modules/sharp/**', 'node_modules/@img/**'],
    },
    compress: true,
    async headers() {
        // L'hôte Matomo doit être autorisé explicitement, sinon la CSP bloque
        // le script de mesure. Vide = aucune mesure, aucune exception.
        const matomo = process.env.NEXT_PUBLIC_MATOMO_URL?.replace(/\/$/, '') ?? '';
        const allow = (directive: string) => (matomo ? `${directive} ${matomo}` : directive);

        // `'unsafe-inline'` sur script-src n'est pas un oubli : Next injecte ses
        // propres scripts en ligne pour l'hydratation, sans nonce tant qu'on ne
        // passe pas par un proxy à la requête. La politique garde tout son sens
        // malgré ça — elle interdit les scripts d'hôtes tiers, et `connect-src`
        // empêche l'exfiltration vers un serveur arbitraire.

        // En DÉVELOPPEMENT seulement : `next dev` évalue les modules et les
        // cartes de source via `eval()` pour le rechargement à chaud. Sans cette
        // exception, la console n'affiche que « eval() is not supported in this
        // environment » et rien ne s'hydrate. En production le bundle n'appelle
        // jamais `eval()` : l'autoriser là-bas rouvrirait précisément la porte
        // que cette politique referme.
        const devEval = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";

        const csp = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            allow(`script-src 'self' 'unsafe-inline'${devEval}`),
            // Tailwind pose des styles en ligne ; aucune source externe.
            "style-src 'self' 'unsafe-inline'",
            allow("img-src 'self' data: blob:"),
            "font-src 'self' data:",
            allow("connect-src 'self'"),
            "manifest-src 'self'",
            "worker-src 'self' blob:",
            'upgrade-insecure-requests',
        ].join('; ');

        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: csp },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    // Le jeu n'a besoin d'aucune de ces interfaces : les refuser
                    // évite qu'une dépendance compromise puisse les demander.
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
