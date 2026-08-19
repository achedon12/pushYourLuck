import { describe, expect, it } from 'vitest';
import { nextRandom, nextInt, shuffle, seedFromString } from './rng';

describe('générateur déterministe', () => {
    it('rend toujours la même suite pour une graine donnée', () => {
        const draw = (seed: number) => {
            let state = seed;
            return Array.from({ length: 5 }, () => {
                const [value, next] = nextRandom(state);
                state = next;
                return value;
            });
        };

        expect(draw(1234)).toEqual(draw(1234));
        expect(draw(1234)).not.toEqual(draw(1235));
    });

    it('produit des valeurs dans [0, 1[', () => {
        let state = 42;
        for (let i = 0; i < 500; i++) {
            const [value, next] = nextRandom(state);
            state = next;
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it('borne les entiers à [0, max[', () => {
        let state = 7;
        for (let i = 0; i < 300; i++) {
            const [value, next] = nextInt(state, 6);
            state = next;
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(6);
        }
    });

    it('mélange sans muter l’entrée ni perdre d’élément', () => {
        const source = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f']);
        const [shuffled] = shuffle(source, 99);

        expect(source).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect([...shuffled].sort()).toEqual([...source].sort());
    });

    it('mélange à l’identique pour une même graine', () => {
        const deck = ['a', 'b', 'c', 'd', 'e'];
        expect(shuffle(deck, 5)[0]).toEqual(shuffle(deck, 5)[0]);
    });

    it('dérive une graine stable et distincte à partir d’une chaîne', () => {
        expect(seedFromString('2026-08-19')).toBe(seedFromString('2026-08-19'));
        expect(seedFromString('2026-08-19')).not.toBe(seedFromString('2026-08-20'));
        expect(seedFromString('x')).toBeGreaterThanOrEqual(0);
    });
});
