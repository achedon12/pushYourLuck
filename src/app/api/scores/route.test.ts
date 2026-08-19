import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * La base est simulée : ces cas vérifient la porte d'entrée de l'API — validation,
 * filtre de pseudos, rejeu — et cette porte doit se fermer AVANT toute écriture.
 */
const prismaMock = {
    score: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { POST, GET } = await import('./route');

let ipCounter = 0;

/**
 * Chaque appel part d'une IP distincte, sinon le quota fausse les autres cas.
 *
 * `Origin` est obligatoire depuis que les écritures sont réservées au site :
 * sans lui, la route répond 403 et aucun des cas ci-dessous n'atteindrait la
 * validation qu'il prétend éprouver.
 */
const post = (body: unknown, ip = `test-ip-${ipCounter++}`) =>
    POST(new Request('http://localhost/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, Origin: 'http://localhost' },
        body: JSON.stringify(body),
    }));

const valid = {
    mode: 'free' as const,
    name: 'Leo',
    clientId: 'client-0123456789',
    seed: 1,
    actions: 'bbbb',
};

describe('POST /api/scores', () => {
    beforeEach(() => {
        prismaMock.score.findUnique.mockReset();
        prismaMock.score.upsert.mockReset();
        prismaMock.score.count.mockReset();
    });

    it('refuse un envoi qui ne vient pas du site', async () => {
        // Premier verrou de la route, avant même la lecture du corps.
        const res = await POST(new Request('http://localhost/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
            body: JSON.stringify(valid),
        }));

        expect(res.status).toBe(403);
        await expect(res.json()).resolves.toEqual({ error: 'forbidden_origin' });
        expect(prismaMock.score.upsert).not.toHaveBeenCalled();
    });

    it('refuse un envoi sans origine du tout', async () => {
        const res = await POST(new Request('http://localhost/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(valid),
        }));

        expect(res.status).toBe(403);
    });

    it('refuse un corps illisible', async () => {
        const res = await POST(new Request('http://localhost/api/scores', {
            method: 'POST',
            headers: { Origin: 'http://localhost' },
            body: 'pas du json',
        }));
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_body' });
    });

    it('refuse un mode inconnu', async () => {
        const res = await post({ ...valid, mode: 'triche' });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_mode' });
    });

    it('refuse un pseudo trop court', async () => {
        const res = await post({ ...valid, name: 'a' });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_name' });
    });

    it('refuse un pseudo interdit', async () => {
        const res = await post({ ...valid, name: 'connard' });
        expect(res.status).toBe(422);
        await expect(res.json()).resolves.toEqual({ error: 'blocked_name' });
    });

    it('refuse un identifiant de navigateur trop court', async () => {
        const res = await post({ ...valid, clientId: 'court' });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_client' });
    });

    it('refuse une partie forgée', async () => {
        const res = await post(valid);
        expect(res.status).toBe(422);
        await expect(res.json()).resolves.toEqual({ error: 'replay_rejected' });
    });

    it('n’écrit RIEN en base quand la requête est refusée', async () => {
        await post({ ...valid, name: 'connard' });
        await post(valid);
        expect(prismaMock.score.upsert).not.toHaveBeenCalled();
    });

    it('refuse au-delà du quota, avec un délai d’attente', async () => {
        const ip = 'ip-quota';
        for (let i = 0; i < 20; i++) await post(valid, ip);

        const refused = await post(valid, ip);
        expect(refused.status).toBe(429);
        await expect(refused.json()).resolves.toEqual({ error: 'too_many_requests' });
        expect(Number(refused.headers.get('Retry-After'))).toBeGreaterThan(0);
    });

    it('ne pénalise pas les autres appelants', async () => {
        const ip = 'ip-bruyant';
        for (let i = 0; i < 25; i++) await post(valid, ip);

        // L'inondation d'un joueur ne doit pas fermer le classement aux autres.
        expect((await post(valid, 'ip-tranquille')).status).toBe(422);
    });

    it('refuse un corps trop volumineux avant de le lire', async () => {
        const res = await POST(new Request('http://localhost/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'content-length': String(2 * 1024 * 1024),
                'x-forwarded-for': 'ip-gros-corps',
                Origin: 'http://localhost',
            },
            body: JSON.stringify(valid),
        }));
        expect(res.status).toBe(413);
    });

    it('refuse un pseudo qui n’est pas une chaîne', async () => {
        // `String({})` donnait « [object Object] », qui franchissait le filtre.
        const res = await post({ ...valid, name: { $ne: null } });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'invalid_name' });
    });

    it('ne renvoie jamais la raison détaillée d’un rejet de rejeu', async () => {
        // La détail indiquerait à qui fabrique une partie où sa suite a cloché.
        const body = await (await post(valid)).json();
        expect(JSON.stringify(body)).not.toContain('action');
    });
});

describe('GET /api/scores', () => {
    it('refuse un mode inconnu', async () => {
        const res = await GET(new Request('http://localhost/api/scores?mode=triche'));
        expect(res.status).toBe(400);
    });

    it('borne le nombre de résultats demandés', async () => {
        prismaMock.score.findMany.mockResolvedValue([]);
        await GET(new Request('http://localhost/api/scores?mode=daily&limit=99999'));
        expect(prismaMock.score.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 100 }),
        );
    });
});
