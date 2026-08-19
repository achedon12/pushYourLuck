'use client';

import { Moon, Sun } from 'lucide-react';

export const THEME_KEY = 'pyl.theme';

/**
 * Bascule clair / sombre.
 *
 * Aucun état React : le thème effectif est déjà porté par la cascade CSS (voir
 * globals.css), et les deux icônes sont rendues côté serveur, l'une masquée.
 * Le composant ne lit donc rien pendant le rendu — ce qui supprime à la fois
 * l'écart d'hydratation et le clignotement au montage.
 */
export function ThemeToggle({ label }: { label: string }) {
    const toggle = () => {
        const root = document.documentElement;
        const forced = root.dataset.theme;
        const isDark = forced
            ? forced === 'dark'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;

        const next = isDark ? 'light' : 'dark';
        root.dataset.theme = next;
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch {
            // Navigation privée ou stockage refusé : le thème vaut pour la
            // session en cours, ce qui est mieux que de faire échouer le clic.
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-line-hi hover:text-text"
            aria-label={label}
            title={label}
        >
            <Sun size={15} className="only-dark" aria-hidden />
            <Moon size={15} className="only-light" aria-hidden />
        </button>
    );
}

/**
 * Script exécuté pendant l'analyse du HTML, avant la première peinture : sans
 * lui, un utilisateur ayant forcé un thème verrait d'abord celui du système.
 * Il est volontairement minuscule et sans dépendance.
 */
export const themeBootScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
