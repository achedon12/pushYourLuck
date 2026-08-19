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
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                ],
            },
        ];
    },
};

export default nextConfig;
