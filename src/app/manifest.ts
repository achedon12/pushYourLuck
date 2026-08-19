import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { fr } from '@/i18n/fr';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: `${site.name} — ${fr.site.tagline}`,
        short_name: site.name,
        description: fr.site.description,
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#07070a',
        theme_color: '#07070a',
        lang: 'fr-FR',
        categories: ['games'],
        icons: [
            { src: '/logo-mark-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/logo-mark-384.png', sizes: '384x384', type: 'image/png' },
            { src: '/logo-mark-512.png', sizes: '512x512', type: 'image/png' },
        ],
    };
}
