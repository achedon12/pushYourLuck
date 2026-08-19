import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { RootShell } from '@/components/RootShell';
import { baseMetadata } from '@/lib/metadata';

/**
 * Layout racine français.
 *
 * Le site a DEUX layouts racine, un par groupe de routes. C'est ce qui permet
 * de servir le français sur des URL sans préfixe (`/regles`) tout en donnant à
 * chaque langue son propre `<html lang>` — impossible avec un layout unique, et
 * sans avoir à rediriger la page d'accueil ni à passer par un proxy.
 */
export const metadata = baseMetadata('fr');

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f4f2ed' },
        { media: '(prefers-color-scheme: dark)', color: '#07070a' },
    ],
    colorScheme: 'light dark',
    width: 'device-width',
    initialScale: 1,
    // Le plateau tient dans un écran : autoriser le zoom évite de piéger les
    // utilisateurs qui grossissent le texte, sans casser la mise en page.
    maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return <RootShell locale="fr">{children}</RootShell>;
}
