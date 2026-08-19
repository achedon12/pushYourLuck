import { describe, expect, it, vi } from 'vitest';

const prismaMock = { score: { deleteMany: vi.fn() } };
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

const { purgeOldScores } = await import('./retention');

describe('durée de conservation', () => {
    it('supprime les scores quotidiens de plus d’un an', async () => {
        prismaMock.score.deleteMany.mockResolvedValue({ count: 3 });

        const removed = await purgeOldScores();

        expect(removed).toBe(3);
        const where = prismaMock.score.deleteMany.mock.calls[0][0].where;
        expect(where.mode).toBe('daily');

        // La coupure doit tomber environ un an en arrière : c'est la durée
        // annoncée sur la page confidentialité, pas un réglage de confort.
        const cutoff = new Date(`${where.dayKey.lt}T00:00:00Z`).getTime();
        const oneYearAgo = Date.now() - 365 * 24 * 3_600_000;
        expect(Math.abs(cutoff - oneYearAgo)).toBeLessThan(3 * 24 * 3_600_000);
    });

    it('ne touche jamais aux scores du mode libre', async () => {
        prismaMock.score.deleteMany.mockResolvedValue({ count: 0 });
        await purgeOldScores();
        expect(prismaMock.score.deleteMany.mock.calls.at(-1)?.[0].where.mode).toBe('daily');
    });
});
