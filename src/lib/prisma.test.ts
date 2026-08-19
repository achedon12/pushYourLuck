import { afterEach, describe, expect, it, vi } from 'vitest';

describe('client Prisma', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
        delete (globalThis as { prisma?: unknown }).prisma;
    });

    it('s’importe sans DATABASE_URL — la compilation ne doit pas dépendre de la base', async () => {
        vi.stubEnv('DATABASE_URL', '');
        vi.resetModules();

        // C'est tout l'intérêt du mandataire : l'import seul ne construit rien,
        // donc `next build` peut collecter les routes sans identifiants.
        await expect(import('./prisma')).resolves.toBeDefined();
    });

    it('signale clairement une configuration manquante à la première requête', async () => {
        vi.stubEnv('DATABASE_URL', '');
        vi.resetModules();

        const { prisma } = await import('./prisma');
        expect(() => prisma.score).toThrow(/DATABASE_URL est absent/);
    });
});
