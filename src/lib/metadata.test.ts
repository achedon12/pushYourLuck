import { describe, expect, it } from 'vitest';
import { pageMetadata, baseMetadata } from './metadata';
import { path } from '@/i18n/routes';

describe('métadonnées de page (référencement)', () => {
    it('pointe la canonique sur la page elle-même', () => {
        const meta = pageMetadata({ locale: 'fr', key: 'rules', title: 'Règles', description: 'D' });
        expect(meta.alternates?.canonical).toBe(path('rules', 'fr'));
    });

    it('déclare les deux traductions et un x-default', () => {
        const meta = pageMetadata({ locale: 'en', key: 'rules', title: 'Rules', description: 'D' });
        expect(meta.alternates?.languages).toEqual({
            fr: '/regles',
            en: '/en/rules',
            'x-default': '/regles',
        });
    });

    it('reste réciproque : les deux langues annoncent les mêmes traductions', () => {
        const fr = pageMetadata({ locale: 'fr', key: 'leaderboard', title: 'A', description: 'D' });
        const en = pageMetadata({ locale: 'en', key: 'leaderboard', title: 'B', description: 'D' });
        expect(fr.alternates?.languages).toEqual(en.alternates?.languages);
    });

    it('rend le titre d’accueil ABSOLU pour éviter la marque en double', () => {
        const home = pageMetadata({ locale: 'fr', key: 'home', title: 'Push Your Luck — X', description: 'D' });
        expect(home.title).toEqual({ absolute: 'Push Your Luck — X' });
    });

    it('laisse le gabarit s’appliquer aux autres pages', () => {
        const rules = pageMetadata({ locale: 'fr', key: 'rules', title: 'Règles', description: 'D' });
        expect(rules.title).toBe('Règles');
    });

    it('renseigne Open Graph avec la locale de la page', () => {
        const en = pageMetadata({ locale: 'en', key: 'home', title: 'T', description: 'D' });
        expect(en.openGraph).toMatchObject({ locale: 'en', url: '/en' });
    });

    it('autorise l’indexation et fixe une base d’URL absolue', () => {
        const base = baseMetadata('fr');
        expect(base.robots).toMatchObject({ index: true, follow: true });
        expect(String(base.metadataBase)).toContain('pushyourluck');
    });
});
