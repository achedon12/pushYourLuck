import { describe, expect, it } from 'vitest';
import { ROUTES, ROUTE_KEYS, path, alternates, MONTH_PARAM } from './routes';
import { LOCALES, DEFAULT_LOCALE } from './config';

describe('table des URL', () => {
    it('définit chaque page dans toutes les langues', () => {
        for (const key of ROUTE_KEYS) {
            for (const locale of LOCALES) {
                expect(path(key, locale), `${key}/${locale}`).toMatch(/^\//);
            }
        }
    });

    it('n’attribue jamais deux fois la même URL', () => {
        const urls = LOCALES.flatMap((locale) => ROUTE_KEYS.map((key) => path(key, locale)));
        expect(new Set(urls).size).toBe(urls.length);
    });

    it('laisse la langue par défaut sans préfixe et préfixe l’autre', () => {
        expect(path('home', DEFAULT_LOCALE)).toBe('/');
        expect(path('rules', 'fr')).toBe('/regles');
        expect(path('rules', 'en')).toBe('/en/rules');
        for (const key of ROUTE_KEYS) {
            expect(path(key, 'en')).toMatch(/^\/en(\/|$)/);
        }
    });

    it('traduit les slugs plutôt que de les recopier', () => {
        expect(ROUTES.rules.en).not.toContain('regles');
        expect(ROUTES.leaderboard.en).not.toContain('classement');
    });

    it('rend les traductions d’une page pour les balises hreflang', () => {
        expect(alternates('rules')).toEqual({ fr: '/regles', en: '/en/rules' });
    });

    it('traduit aussi le paramètre du calendrier', () => {
        expect(MONTH_PARAM.fr).toBe('mois');
        expect(MONTH_PARAM.en).toBe('month');
    });
});
