import { describe, expect, it } from 'vitest';
import { THEME_KEY, themeBootScript } from './ThemeToggle';

/** Exécute le script d'amorçage avec un faux document et un faux stockage. */
function boot(stored: string | null, { throwing = false } = {}) {
    const root = { dataset: {} as Record<string, string> };
    const localStorage = {
        getItem: () => {
            if (throwing) throw new Error('stockage refusé');
            return stored;
        },
    };
    new Function('document', 'localStorage', themeBootScript)({ documentElement: root }, localStorage);
    return root.dataset.theme;
}

describe('amorçage du thème', () => {
    it('applique le thème mémorisé avant la première peinture', () => {
        expect(boot('dark')).toBe('dark');
        expect(boot('light')).toBe('light');
    });

    it('ne pose rien sans choix explicite — le réglage système prend la main', () => {
        expect(boot(null)).toBeUndefined();
    });

    it('ignore une valeur inattendue plutôt que de l’appliquer', () => {
        expect(boot('bleu')).toBeUndefined();
    });

    it('ne casse pas si le stockage est refusé (navigation privée)', () => {
        expect(() => boot(null, { throwing: true })).not.toThrow();
    });

    it('lit la même clé que celle utilisée par la bascule', () => {
        expect(themeBootScript).toContain(THEME_KEY);
    });
});
