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
        const csp = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            allow("script-src 'self' 'unsafe-inline'"),
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
