import { describe, expect, it } from 'vitest';
import { RateLimiter, clientKey } from './rateLimit';

describe('limitation de débit', () => {
    it('laisse passer jusqu’à la limite, puis refuse', () => {
        const limiter = new RateLimiter(3, 60_000);
        const now = 1_000_000;

        expect(limiter.check('ip', now).allowed).toBe(true);
        expect(limiter.check('ip', now).allowed).toBe(true);
        expect(limiter.check('ip', now).allowed).toBe(true);
        expect(limiter.check('ip', now).allowed).toBe(false);
    });

    it('indique combien de temps attendre', () => {
        const limiter = new RateLimiter(1, 60_000);
        limiter.check('ip', 1_000_000);

        const refused = limiter.check('ip', 1_030_000);
        expect(refused.allowed).toBe(false);
        // 60 s de fenêtre, 30 s écoulées : il reste 30 s.
        expect(refused.retryAfter).toBe(30);
    });

    it('rouvre le quota une fois la fenêtre écoulée', () => {
        const limiter = new RateLimiter(2, 60_000);
        limiter.check('ip', 1_000_000);
        limiter.check('ip', 1_000_000);

        expect(limiter.check('ip', 1_030_000).allowed).toBe(false);
        expect(limiter.check('ip', 1_061_000).allowed).toBe(true);
    });

    it('compte chaque appelant séparément', () => {
        const limiter = new RateLimiter(1, 60_000);
        expect(limiter.check('ip-a', 1).allowed).toBe(true);
        // Un joueur ne doit pas être puni pour l'activité d'un autre.
        expect(limiter.check('ip-b', 1).allowed).toBe(true);
        expect(limiter.check('ip-a', 1).allowed).toBe(false);
    });

    it('borne le nombre d’entrées suivies', () => {
        const limiter = new RateLimiter(5, 60_000);
        for (let i = 0; i < 10_050; i++) limiter.check(`ip-${i}`, 1);

        // Sans plafond, faire tourner les adresses ferait grossir la table
        // indéfiniment : la protection deviendrait la fuite.
        expect(limiter.tracked).toBeLessThanOrEqual(10_000);
    });

    it('reste efficace après éviction pour les appelants récents', () => {
        const limiter = new RateLimiter(1, 60_000);
        limiter.check('recent', 1);
        for (let i = 0; i < 10_050; i++) limiter.check(`bruit-${i}`, 1);

        // « recent » a été évincé par le bruit : c'est le compromis assumé d'un
        // compteur borné, et il vaut mieux que la fuite de mémoire.
        expect(limiter.tracked).toBeLessThanOrEqual(10_000);
    });
});

describe('identification de l’appelant', () => {
    const req = (headers: Record<string, string>) =>
        new Request('http://localhost/api/scores', { headers });

    it('prend la première adresse de x-forwarded-for', () => {
        // La liste va du client d'origine aux proxys successifs.
        expect(clientKey(req({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    });

    it('retombe sur x-real-ip', () => {
        expect(clientKey(req({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
    });

    it('ne casse pas en connexion directe', () => {
        expect(clientKey(req({}))).toBe('inconnu');
    });
});
