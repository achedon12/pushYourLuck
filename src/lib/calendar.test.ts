import { describe, expect, it } from 'vitest';
import { buildMonthGrid, bestPerDay } from './calendar';

describe('grille du calendrier', () => {
    it('compte les jours du mois, février bissextile compris', () => {
        expect(buildMonthGrid('2026-08').daysInMonth).toBe(31);
        expect(buildMonthGrid('2026-04').daysInMonth).toBe(30);
        expect(buildMonthGrid('2026-02').daysInMonth).toBe(28);
        expect(buildMonthGrid('2028-02').daysInMonth).toBe(29);
    });

    it('décale la première case pour une semaine commençant le lundi', () => {
        // 1er août 2026 = samedi → cinq cases vides avant lui.
        expect(buildMonthGrid('2026-08').firstWeekday).toBe(5);
        // 1er juin 2026 = lundi → aucune case vide.
        expect(buildMonthGrid('2026-06').firstWeekday).toBe(0);
        // 1er mars 2026 = dimanche → six cases vides, le pire cas.
        expect(buildMonthGrid('2026-03').firstWeekday).toBe(6);
    });

    it('énumère les jours au format des clés de score', () => {
        const grid = buildMonthGrid('2026-08');
        expect(grid.days[0]).toBe('2026-08-01');
        expect(grid.days.at(-1)).toBe('2026-08-31');
        expect(grid.days).toHaveLength(31);
    });
});

describe('meilleur score par jour', () => {
    const rows = [
        { dayKey: '2026-08-01', score: 200, rounds: 7, name: 'Alice' },
        { dayKey: '2026-08-01', score: 150, rounds: 4, name: 'Bruno' },
        { dayKey: '2026-08-02', score: 90, rounds: 3, name: 'Chloe' },
    ];

    it('ne garde que la première ligne de chaque jour', () => {
        const best = bestPerDay(rows);
        expect(best).toHaveLength(2);
        expect(best[0]).toMatchObject({ dayKey: '2026-08-01', score: 200, name: 'Alice' });
    });

    it('affiche les manches encaissées, pas la manche en cours', () => {
        expect(bestPerDay(rows)[0].rounds).toBe(6);
    });

    it('ne descend jamais sous zéro manche', () => {
        expect(bestPerDay([{ dayKey: '2026-08-03', score: 0, rounds: 0, name: 'X' }])[0].rounds).toBe(0);
    });

    it('rend une liste vide sans données', () => {
        expect(bestPerDay([])).toEqual([]);
    });
});
