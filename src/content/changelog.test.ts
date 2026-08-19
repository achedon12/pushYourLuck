import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './changelog';

describe('journal des versions', () => {
    it('n’est jamais vide — les pages légales datent leur mise à jour dessus', () => {
        expect(CHANGELOG.length).toBeGreaterThan(0);
    });

    it('va de la version la plus récente à la plus ancienne', () => {
        const dates = CHANGELOG.map((release) => release.date);
        expect(dates).toEqual([...dates].sort().reverse());
    });

    it('date chaque version au format ISO', () => {
        for (const release of CHANGELOG) {
            expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(Number.isNaN(Date.parse(release.date))).toBe(false);
        }
    });

    it('numérote les versions de façon unique', () => {
        const versions = CHANGELOG.map((release) => release.version);
        expect(new Set(versions).size).toBe(versions.length);
    });

    it('traduit CHAQUE entrée dans les deux langues', () => {
        // Une note publiée à moitié traduite laisserait du français sur la page
        // anglaise : c'est le seul contenu où les deux langues cohabitent.
        for (const release of CHANGELOG) {
            expect(release.changes.length).toBeGreaterThan(0);
            for (const change of release.changes) {
                expect(change.fr.trim()).not.toBe('');
                expect(change.en.trim()).not.toBe('');
                expect(change.en).not.toBe(change.fr);
                expect(['feature', 'balance', 'fix']).toContain(change.type);
            }
        }
    });
});
