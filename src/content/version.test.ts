import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './changelog';
import pkg from '../../package.json';

describe('version de l’application', () => {
    it('correspond à la dernière entrée du journal des versions', () => {
        // Le pied de page affiche la version de package.json et renvoie vers les
        // nouveautés : les deux qui divergent enverraient le visiteur lire les
        // notes d'une autre version que celle qu'il utilise.
        expect(pkg.version).toBe(CHANGELOG[0].version);
    });

    it('suit le versionnage sémantique', () => {
        expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
