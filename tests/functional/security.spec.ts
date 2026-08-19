import { expect, test } from '@playwright/test';
import { seedTestDatabase, SITE_ORIGIN } from '../fixtures';

/**
 * Les en-têtes et les quotas ne sont réels qu'une fois servis : un test
 * unitaire sur l'objet de configuration ne dirait pas si Next les applique.
 */
test.describe('en-têtes de sécurité', () => {
    test('pose une politique de sécurité du contenu restrictive', async ({ request }) => {
        const csp = (await request.get('/')).headers()['content-security-policy'];

        expect(csp).toBeTruthy();
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("frame-ancestors 'self'");
        // Aucun hôte tiers autorisé quand la mesure d'audience est désactivée :
        // c'est ce qui empêche une dépendance compromise d'exfiltrer.
        expect(csp).toContain("connect-src 'self'");
        expect(csp).not.toMatch(/connect-src[^;]*https?:\/\//);
        // `'unsafe-eval'` est concédé à `next dev`, qui charge ses modules par
        // `eval()`. Ces tests tournent sur une construction de production : l'y
        // trouver signifierait que la concession a fui hors du développement.
        expect(csp).not.toContain("'unsafe-eval'");
    });

    test('pose les autres en-têtes attendus', async ({ request }) => {
        const headers = (await request.get('/')).headers();

        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        expect(headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(headers['permissions-policy']).toContain('geolocation=()');
    });

    test('ne divulgue pas la technologie employée', async ({ request }) => {
        expect((await request.get('/')).headers()['x-powered-by']).toBeUndefined();
    });
});

test.describe('limitation de débit', () => {
    test.beforeAll(() => seedTestDatabase());

    test('refuse au-delà du quota et indique le délai', async ({ request }) => {
        const body = {
            mode: 'free', name: 'Sonde', seed: 1, actions: 'bbbb',
            clientId: 'security-probe-0001',
        };
        const headers = { 'x-forwarded-for': '198.51.100.42', Origin: SITE_ORIGIN };

        let refused: number | null = null;
        for (let i = 0; i < 25; i++) {
            const res = await request.post('/api/scores', { data: body, headers });
            if (res.status() === 429) {
                refused = i;
                expect(Number(res.headers()['retry-after'])).toBeGreaterThan(0);
                break;
            }
        }

        // Sans quota, l'audit montrait vingt scores valides acceptés en 439 ms
        // depuis une seule machine : le classement entier était confiscable.
        expect(refused, 'aucune requête refusée après 25 tentatives').not.toBeNull();
    });

    test('un appelant bruyant n’enferme pas les autres', async ({ request }) => {
        const body = { mode: 'free', name: 'Sonde', seed: 1, actions: 'bbbb', clientId: 'security-probe-0002' };
        for (let i = 0; i < 25; i++) {
            await request.post('/api/scores', {
                data: body, headers: { 'x-forwarded-for': '198.51.100.43', Origin: SITE_ORIGIN },
            });
        }

        const other = await request.post('/api/scores', {
            data: body, headers: { 'x-forwarded-for': '198.51.100.44', Origin: SITE_ORIGIN },
        });
        expect(other.status()).not.toBe(429);
    });

    test('refuse un corps démesuré', async ({ request }) => {
        const res = await request.post('/api/scores', {
            data: { mode: 'free', name: 'Sonde', seed: 1, actions: 'd'.repeat(100_000), clientId: 'security-probe-0003' },
            headers: { 'x-forwarded-for': '198.51.100.45', Origin: SITE_ORIGIN },
        });
        expect(res.status()).toBe(413);
    });
});

/**
 * Le garde d'origine est testé unitairement (`src/lib/origin.test.ts`), mais
 * seule cette couche dit s'il est réellement BRANCHÉ sur la route : un helper
 * juste qu'on oublie d'appeler laisse l'API grande ouverte sans qu'aucun test
 * unitaire ne bronche.
 */
test.describe('origine des écritures', () => {
    test.beforeAll(() => seedTestDatabase());

    const body = { mode: 'free', name: 'Sonde', seed: 1, actions: 'bbbb', clientId: 'origin-probe-0001' };

    test('refuse un envoi sans origine', async ({ request }) => {
        const res = await request.post('/api/scores', {
            data: body, headers: { 'x-forwarded-for': '198.51.100.60' },
        });

        expect(res.status()).toBe(403);
        expect((await res.json()).error).toBe('forbidden_origin');
    });

    test('refuse un envoi présenté comme venant d’un autre site', async ({ request }) => {
        const res = await request.post('/api/scores', {
            data: body, headers: { 'x-forwarded-for': '198.51.100.61', Origin: 'https://evil.example' },
        });

        expect(res.status()).toBe(403);
    });

    test('laisse passer un envoi du site', async ({ request }) => {
        const res = await request.post('/api/scores', {
            data: body, headers: { 'x-forwarded-for': '198.51.100.62', Origin: SITE_ORIGIN },
        });

        expect(res.status()).not.toBe(403);
    });

    test('la lecture du classement reste publique', async ({ request }) => {
        // Délibéré : le classement est affiché sur le site, rien n'y est privé,
        // et le fermer n'empêcherait personne de le lire depuis une page.
        expect((await request.get('/api/scores?mode=daily')).status()).toBe(200);
    });
});
