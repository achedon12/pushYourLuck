import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `site.url` est lue à l'import du module : chaque cas doit donc réimporter
 * après avoir posé son environnement, d'où les `vi.resetModules()`.
 */
const load = async () => {
    vi.resetModules();
    return (await import('./origin')).isTrustedOrigin;
};

const req = (headers: Record<string, string>) =>
    new Request('https://pushyourluck.net/api/scores', { method: 'POST', headers });

describe('origine des écritures', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('accepte une origine identique à celle du site', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://pushyourluck.net');
        vi.stubEnv('NODE_ENV', 'production');
        const isTrustedOrigin = await load();

        expect(isTrustedOrigin(req({ origin: 'https://pushyourluck.net' }))).toBe(true);
    });

    it('refuse une autre origine', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://pushyourluck.net');
        vi.stubEnv('NODE_ENV', 'production');
        const isTrustedOrigin = await load();

        expect(isTrustedOrigin(req({ origin: 'https://evil.example' }))).toBe(false);
        // Un sous-domaine n'est pas le site : `origin` se compare en entier,
        // jamais par préfixe ou par suffixe — « pushyourluck.net.evil.example »
        // passerait sinon.
        expect(isTrustedOrigin(req({ origin: 'https://pushyourluck.net.evil.example' }))).toBe(false);
        // Le schéma compte aussi : un http:// pourrait être injecté en clair.
        expect(isTrustedOrigin(req({ origin: 'http://pushyourluck.net' }))).toBe(false);
    });

    it('refuse une requête sans origine', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://pushyourluck.net');
        vi.stubEnv('NODE_ENV', 'production');
        const isTrustedOrigin = await load();

        // Tout navigateur en pose un, y compris pour une requête de même
        // origine : son absence signale un appel fabriqué.
        expect(isTrustedOrigin(req({}))).toBe(false);
    });

    it('tolère localhost hors production, et seulement là', async () => {
        // En développement le navigateur annonce http://localhost:3001 alors
        // que NEXT_PUBLIC_SITE_URL désigne le domaine de production : sans
        // cette tolérance, plus aucun score ne partirait en local.
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://pushyourluck.net');
        vi.stubEnv('NODE_ENV', 'development');
        let isTrustedOrigin = await load();
        expect(isTrustedOrigin(req({ origin: 'http://localhost:3001' }))).toBe(true);
        expect(isTrustedOrigin(req({ origin: 'http://127.0.0.1:3002' }))).toBe(true);

        vi.stubEnv('NODE_ENV', 'production');
        isTrustedOrigin = await load();
        expect(isTrustedOrigin(req({ origin: 'http://localhost:3001' }))).toBe(false);
    });
});
