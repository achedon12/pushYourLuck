import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackerBase, scoreBucket } from './analytics';

describe('mesure d’audience', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('normalise l’URL de l’instance', () => {
        expect(trackerBase('https://matomo.example.com')).toBe('https://matomo.example.com/');
        expect(trackerBase('https://matomo.example.com/')).toBe('https://matomo.example.com/');
    });

    it('rend une base vide quand rien n’est configuré', () => {
        expect(trackerBase('')).toBe('');
    });

    it('range les scores en paliers plutôt que de les transmettre tels quels', () => {
        // Un score exact horodaté est un identifiant ; un palier, non.
        expect(scoreBucket(0)).toBe('0');
        expect(scoreBucket(49)).toBe('1-49');
        expect(scoreBucket(50)).toBe('50-99');
        expect(scoreBucket(199)).toBe('100-199');
        expect(scoreBucket(200)).toBe('200-399');
        expect(scoreBucket(10_000)).toBe('400+');
    });

    it('ne suit rien tant que les variables ne sont pas renseignées', async () => {
        vi.stubEnv('NEXT_PUBLIC_MATOMO_URL', '');
        vi.stubEnv('NEXT_PUBLIC_MATOMO_SITE_ID', '');
        vi.stubEnv('NODE_ENV', 'production');
        vi.resetModules();

        const analytics = await import('./analytics');
        expect(analytics.isAnalyticsConfigured()).toBe(false);
    });

    it('ne suit rien hors production, même configurée', async () => {
        // Sans ce garde-fou, chaque `npm run dev` compterait des vues dans les
        // chiffres réels.
        vi.stubEnv('NEXT_PUBLIC_MATOMO_URL', 'https://matomo.example.com');
        vi.stubEnv('NEXT_PUBLIC_MATOMO_SITE_ID', '7');
        vi.stubEnv('NODE_ENV', 'development');
        vi.resetModules();

        const analytics = await import('./analytics');
        expect(analytics.isAnalyticsConfigured()).toBe(false);
    });

    it('suit en production quand les deux variables sont présentes', async () => {
        vi.stubEnv('NEXT_PUBLIC_MATOMO_URL', 'https://matomo.example.com');
        vi.stubEnv('NEXT_PUBLIC_MATOMO_SITE_ID', '7');
        vi.stubEnv('NODE_ENV', 'production');
        vi.resetModules();

        const analytics = await import('./analytics');
        expect(analytics.isAnalyticsConfigured()).toBe(true);
    });
});
