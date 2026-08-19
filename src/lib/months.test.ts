import { describe, expect, it } from 'vitest';
import { shiftMonth, clampMonth } from './months';

describe('navigation du calendrier', () => {
    it('décale d’un mois', () => {
        expect(shiftMonth('2026-08', -1)).toBe('2026-07');
        expect(shiftMonth('2026-08', 1)).toBe('2026-09');
    });

    it('franchit correctement les changements d’année', () => {
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(shiftMonth('2026-12', 1)).toBe('2027-01');
        expect(shiftMonth('2026-03', -12)).toBe('2025-03');
        expect(shiftMonth('2026-03', 12)).toBe('2027-03');
    });

    it('ramène un mois hors bornes dans l’intervalle jouable', () => {
        expect(clampMonth('2020-01', '2026-04', '2026-08')).toBe('2026-04');
        expect(clampMonth('2030-01', '2026-04', '2026-08')).toBe('2026-08');
        expect(clampMonth('2026-06', '2026-04', '2026-08')).toBe('2026-06');
    });

    it('retombe sur le mois courant si le paramètre est absent ou malformé', () => {
        expect(clampMonth(undefined, '2026-04', '2026-08')).toBe('2026-08');
        expect(clampMonth('n’importe quoi', '2026-04', '2026-08')).toBe('2026-08');
        expect(clampMonth('2026-8', '2026-04', '2026-08')).toBe('2026-08');
    });
});
