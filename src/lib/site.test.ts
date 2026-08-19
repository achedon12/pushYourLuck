import { describe, expect, it } from 'vitest';
import { site, absoluteUrl } from './site';

describe('identité du site', () => {
    it('construit des URL absolues à partir de chemins', () => {
        expect(absoluteUrl('/regles')).toBe('https://pushyourluck.net/regles');
        expect(absoluteUrl('/')).toBe('https://pushyourluck.net/');
        expect(absoluteUrl()).toBe('https://pushyourluck.net/');
    });

    it('ne contient aucun texte traduisible', () => {
        // Accroche et description vivent dans les dictionnaires : les dupliquer
        // ici garantirait qu'une des deux copies finisse par mentir.
        expect(site).not.toHaveProperty('tagline');
        expect(site).not.toHaveProperty('description');
    });

    it('expose un contact joignable pour les pages légales', () => {
        expect(site.contact).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
    });
});
