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

const post = (body: unknown) =>
    POST(new Request('http://localhost/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    it('refuse un corps illisible', async () => {
        const res = await POST(new Request('http://localhost/api/scores', { method: 'POST', body: 'pas du json' }));
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
