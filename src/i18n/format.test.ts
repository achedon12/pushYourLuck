import { describe, expect, it } from 'vitest';
import { format, plural } from './format';

describe('interpolation', () => {
    it('remplace les variables nommées', () => {
        expect(format('Encaisser rapporte {n} points', { n: 42 })).toBe('Encaisser rapporte 42 points');
    });

    it('laisse la marque intacte si la variable manque', () => {
        expect(format('Score : {n}', {})).toBe('Score : {n}');
    });

    it('remplace toutes les occurrences', () => {
        expect(format('{a} et {b} et {a}', { a: 1, b: 2 })).toBe('1 et 2 et 1');
    });
});

describe('pluriels', () => {
    const forms = { one: '{count} manche', other: '{count} manches' };

    it('met zéro au singulier en français', () => {
        expect(plural('fr-FR', 0, forms)).toBe('0 manche');
        expect(plural('fr-FR', 1, forms)).toBe('1 manche');
        expect(plural('fr-FR', 2, forms)).toBe('2 manches');
    });

    it('met zéro au pluriel en anglais — la règle diffère du français', () => {
        const english = { one: '{count} round', other: '{count} rounds' };
        expect(plural('en', 0, english)).toBe('0 rounds');
        expect(plural('en', 1, english)).toBe('1 round');
        expect(plural('en', 2, english)).toBe('2 rounds');
    });
});
