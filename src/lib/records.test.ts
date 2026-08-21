import { describe, expect, it } from 'vitest';
import { bestPerName, scanSize } from './records';

const row = (name: string, score: number) => ({ name, score });

describe('records par pseudo', () => {
    it('ne garde qu’une ligne par pseudo, la première rencontrée', () => {
        const best = bestPerName([row('achedon12', 191), row('achedon12', 181), row('Couzcouz', 150)], 10);
        expect(best).toEqual([row('achedon12', 191), row('Couzcouz', 150)]);
    });

    it('traite « Leo » et « leo  » comme le même pseudo', () => {
        // Deux graphies du même nom côte à côte dans un classement se lisent
        // comme un doublon, quoi qu'en dise la base.
        const best = bestPerName([row('Leo', 80), row('leo  ', 70)], 10);
        expect(best).toEqual([row('Leo', 80)]);
    });

    it('remplit le tableau avec les pseudos suivants, pas avec des trous', () => {
        const rows = [row('a', 9), row('a', 8), row('b', 7), row('a', 6), row('c', 5)];
        expect(bestPerName(rows, 3)).toEqual([row('a', 9), row('b', 7), row('c', 5)]);
    });

    it('s’arrête à la limite demandée', () => {
        expect(bestPerName([row('a', 3), row('b', 2), row('c', 1)], 2)).toHaveLength(2);
    });

    it('lit large pour absorber les doublons, sans dépasser une borne', () => {
        expect(scanSize(10)).toBe(200);
        expect(scanSize(100)).toBe(2000);
        expect(scanSize(500)).toBe(2000);
    });
});
