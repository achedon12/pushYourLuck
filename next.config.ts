import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
