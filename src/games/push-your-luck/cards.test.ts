import { describe, expect, it } from 'vitest';
import { CARDS, STARTING_DECK, SHOP_POOL } from './cards';

describe('catalogue de cartes', () => {
    it('donne à chaque carte une clé égale à son identifiant', () => {
        for (const [key, card] of Object.entries(CARDS)) {
            expect(card.id).toBe(key);
        }
    });

    it('ne contient ni nom ni description — ce sont des textes traduits', () => {
        // Le catalogue est importé par le moteur, qui tourne aussi côté serveur.
        for (const card of Object.values(CARDS)) {
            expect(card).not.toHaveProperty('name');
            expect(card).not.toHaveProperty('text');
        }
    });

    it('ne référence que des cartes existantes dans le paquet et la boutique', () => {
        for (const id of [...STARTING_DECK, ...SHOP_POOL]) {
            expect(CARDS, `carte inconnue : ${id}`).toHaveProperty(id);
        }
    });

    it('compose un paquet de départ de 26 cartes dont 5 bombes', () => {
        expect(STARTING_DECK).toHaveLength(26);
        expect(STARTING_DECK.filter((id) => id === 'bomb')).toHaveLength(5);
    });

    it('n’expose aucune carte spéciale au premier paquet', () => {
        // La première manche doit s'expliquer en cinq secondes ; la complexité
        // arrive par la boutique.
        const special = STARTING_DECK.filter((id) =>
            ['defuse', 'reveal', 'insure', 'greed', 'scale'].includes(CARDS[id].effect),
        );
        expect(special).toEqual([]);
    });

    it('propose en boutique au moins autant de cartes que d’offres tirées', () => {
        expect(SHOP_POOL.length).toBeGreaterThanOrEqual(3);
        expect(new Set(SHOP_POOL).size).toBe(SHOP_POOL.length);
    });
});
