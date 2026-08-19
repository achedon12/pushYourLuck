import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';
import robots from './robots';
import { LOCALES } from '@/i18n/config';
import { ROUTE_KEYS } from '@/i18n/routes';

describe('plan du site', () => {
    const entries = sitemap();

    it('liste chaque page dans chaque langue', () => {
        expect(entries).toHaveLength(ROUTE_KEYS.length * LOCALES.length);
    });

    it('n’utilise que des URL absolues et uniques', () => {
        for (const entry of entries) expect(entry.url).toMatch(/^https:\/\//);
        expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
    });

    it('déclare les traductions de chaque URL, x-default compris', () => {
        for (const entry of entries) {
            const languages = entry.alternates?.languages ?? {};
            expect(Object.keys(languages).sort()).toEqual(['en', 'fr', 'x-default']);
            expect(languages['x-default']).toBe(languages.fr);
        }
    });

    it('donne la priorité maximale à l’accueil', () => {
        // Repéré par le chemin racine, pas par le domaine : l'assertion doit
        // survivre à un changement de nom de domaine.
        const home = entries.find((entry) => new URL(entry.url).pathname === '/');
        expect(home?.priority).toBe(1);
    });

    it('date le classement d’aujourd’hui et le reste de la dernière version', () => {
        // Dater toutes les pages de « maintenant » à chaque build est un signal
        // faux, que les moteurs finissent par ignorer.
        const board = entries.find((entry) => entry.url.endsWith('/classement'));
        const rules = entries.find((entry) => entry.url.endsWith('/regles'));
        expect(Number(board?.lastModified)).toBeGreaterThan(Number(rules?.lastModified));
    });
});

describe('robots', () => {
    const rules = robots();

    it('autorise l’indexation et interdit l’API', () => {
        expect(rules.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/api/' });
    });

    it('renvoie vers le plan du site', () => {
        expect(rules.sitemap).toContain('/sitemap.xml');
    });
});
