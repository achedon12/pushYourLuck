import { describe, expect, it } from 'vitest';
import { checkName, normalizeName } from './nameFilter';

/**
 * Les deux listes comptent autant l'une que l'autre. Un filtre qui refuse
 * « Cassandra » fait plus de dégâts qu'un gros mot dans un classement, donc
 * les faux positifs sont testés aussi sérieusement que les refus.
 */
const LEGITIMATE = [
    'Leo', 'Cassandra', 'Connor', 'Constance', 'Assia', 'Bastien', 'Anaïs',
    'Küçük', 'José', 'Marie-Claire', 'xX_Dragon_Xx', 'joueur42', 'Ana', 'Lu',
    'Grand-Mère', "O'Brien", 'Šimon', 'Élodie', 'Thomas', 'Sextant', 'Scunthorpe',
    'Analyste', 'Basset', 'Massa', 'Titouan', 'Clément',
];

const BLOCKED = [
    'admin', 'Admin', 'ADM1N', 'moderateur', 'staff', 'Push Your Luck',
    'connard', 'C0nnard', 'enculé', 'salope', 'PUTAIN', 'p u t a i n',
    'fuck', 'F.U.C.K', 'fuuuuck', 'motherfucker', 'asshole', 'n1gger',
    'faggot', 'hitler', 'nazi', 'kys', '<script>', 'drop table Score',
];

describe('filtre de pseudos', () => {
    it('normalise accents, casse et substitutions', () => {
        expect(normalizeName('Élodie')).toBe('elodie');
        expect(normalizeName('C0nn4rd')).toBe('connard');
        expect(normalizeName('Marie-Claire')).toBe('marie claire');
    });

    it.each(LEGITIMATE)('accepte « %s »', (name) => {
        expect(checkName(name).ok).toBe(true);
    });

    it.each(BLOCKED)('refuse « %s »', (name) => {
        expect(checkName(name).ok).toBe(false);
    });

    it('refuse un pseudo trop court', () => {
        const verdict = checkName('a');
        expect(verdict.ok).toBe(false);
        if (!verdict.ok) expect(verdict.reason).toBe('too_short');
    });

    it('distingue le pseudo trop court du pseudo interdit', () => {
        const verdict = checkName('admin');
        expect(verdict.ok).toBe(false);
        if (!verdict.ok) expect(verdict.reason).toBe('blocked');
    });
});
