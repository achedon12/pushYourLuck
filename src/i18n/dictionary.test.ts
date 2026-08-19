import { describe, expect, it } from 'vitest';
import { fr } from './fr';
import { en } from './en';
import { dict } from './dictionary';
import { LOCALES } from './config';
import { CARDS } from '@/games/push-your-luck/cards';

/** Chemins de toutes les feuilles d'un dictionnaire, pour comparer les structures. */
function leafPaths(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) return [prefix];
    if (Array.isArray(value)) return value.flatMap((item, i) => leafPaths(item, `${prefix}[${i}]`));
    return Object.entries(value).flatMap(([key, child]) =>
        leafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
}

describe('dictionnaires', () => {
    it('ont exactement la même structure dans les deux langues', () => {
        expect(leafPaths(en).sort()).toEqual(leafPaths(fr).sort());
    });

    it('ne contiennent aucune chaîne vide', () => {
        for (const [locale, dictionary] of [['fr', fr], ['en', en]] as const) {
            const empty = leafPaths(dictionary).filter((path) => {
                const value = path
                    .replace(/\[(\d+)\]/g, '.$1')
                    .split('.')
                    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dictionary);
                return typeof value === 'string' && value.trim() === '';
            });
            expect(empty, `chaînes vides en ${locale}`).toEqual([]);
        }
    });

    it('décrivent toutes les cartes du moteur, et rien de plus', () => {
        const engineIds = Object.keys(CARDS).sort();
        expect(Object.keys(fr.cards).sort()).toEqual(engineIds);
        expect(Object.keys(en.cards).sort()).toEqual(engineIds);
    });

    it('donnent des textes réellement différents d’une langue à l’autre', () => {
        // Sans ce garde-fou, une traduction oubliée passerait inaperçue : la
        // structure serait valide, mais la page anglaise resterait en français.
        expect(en.nav.leaderboard).not.toBe(fr.nav.leaderboard);
        expect(en.rules.title).not.toBe(fr.rules.title);
        expect(en.cards.bomb.text).not.toBe(fr.cards.bomb.text);
    });

    it('sont accessibles pour chaque langue déclarée', () => {
        for (const locale of LOCALES) {
            expect(dict(locale).site.name).toBe('Push Your Luck');
        }
    });
});
