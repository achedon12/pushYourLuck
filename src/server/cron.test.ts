import { afterEach, describe, expect, it, vi } from 'vitest';

const schedule = vi.fn();
vi.mock('node-cron', () => ({ default: { schedule } }));
vi.mock('./backup', () => ({ createBackup: vi.fn() }));
vi.mock('./retention', () => ({ purgeOldScores: vi.fn() }));

const { initializeCron } = await import('./cron');

describe('tâches planifiées', () => {
    afterEach(() => {
        schedule.mockClear();
        vi.unstubAllEnvs();
    });

    it('ne planifie RIEN hors production', () => {
        // Sans ce garde-fou, chaque `npm run dev` écrirait un dump chaque nuit.
        vi.stubEnv('NODE_ENV', 'development');
        initializeCron();
        expect(schedule).not.toHaveBeenCalled();
    });

    it('planifie la tâche quotidienne en production', () => {
        vi.stubEnv('NODE_ENV', 'production');
        initializeCron();

        expect(schedule).toHaveBeenCalledTimes(1);
        const [expression, , options] = schedule.mock.calls[0];
        expect(expression).toBe('15 3 * * *');
        // Le fuseau est explicite : sur un serveur en UTC, « 3 h » tomberait à
        // 4 ou 5 h heure française selon la saison.
        expect(options).toMatchObject({ timezone: 'Europe/Paris' });
    });

    it('sauvegarde PUIS purge, dans cet ordre', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        initializeCron();

        const { createBackup } = await import('./backup');
        const { purgeOldScores } = await import('./retention');
        const order: string[] = [];
        vi.mocked(createBackup).mockImplementation(async () => { order.push('backup'); return ''; });
        vi.mocked(purgeOldScores).mockImplementation(async () => { order.push('purge'); return 0; });

        await schedule.mock.calls[0][1]();

        // Purger avant de sauvegarder ferait disparaître les données de l'année
        // écoulée sans qu'aucune archive ne les contienne.
        expect(order).toEqual(['backup', 'purge']);
    });

    it('n’interrompt pas la planification si la tâche échoue', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        initializeCron();

        const { createBackup } = await import('./backup');
        vi.mocked(createBackup).mockRejectedValue(new Error('disque plein'));

        await expect(schedule.mock.calls[0][1]()).resolves.toBeUndefined();
    });
});
