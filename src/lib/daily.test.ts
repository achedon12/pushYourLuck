import { describe, expect, it } from 'vitest';
import { dayKey, dailySeed, formatDayKey, msUntilNextDay } from './daily';

describe('partie du jour', () => {
    it('produit une clé au format ISO', () => {
        expect(dayKey(new Date('2026-08-19T12:00:00Z'))).toBe('2026-08-19');
    });

    it('est calée sur le fuseau de Paris, pas sur UTC', () => {
        // 22h30 UTC = 00h30 à Paris en été : le paquet du lendemain est déjà servi.
        expect(dayKey(new Date('2026-08-19T22:30:00Z'))).toBe('2026-08-20');
        // 01h00 UTC = 03h00 à Paris : toujours le même jour.
        expect(dayKey(new Date('2026-08-19T01:00:00Z'))).toBe('2026-08-19');
    });

    it('donne une graine stable et distincte par jour', () => {
        expect(dailySeed('2026-08-19')).toBe(dailySeed('2026-08-19'));
        expect(dailySeed('2026-08-19')).not.toBe(dailySeed('2026-08-20'));
    });

    it('formate la date dans la langue demandée', () => {
        expect(formatDayKey('2026-08-19', 'fr-FR')).toContain('août');
        expect(formatDayKey('2026-08-19', 'en')).toContain('August');
    });

    it('compte un délai strictement positif jusqu’au prochain paquet', () => {
        const ms = msUntilNextDay(new Date('2026-08-19T12:00:00Z'));
        expect(ms).toBeGreaterThan(0);
        expect(ms).toBeLessThanOrEqual(24 * 3_600_000);
    });
});
