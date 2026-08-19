import { afterEach, describe, expect, it, vi } from 'vitest';

const initializeCron = vi.fn();
vi.mock('./server/cron', () => ({ initializeCron }));

describe('amorçage du serveur', () => {
    afterEach(() => {
        initializeCron.mockClear();
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('démarre les tâches planifiées sur le runtime Node', async () => {
        vi.stubEnv('NEXT_RUNTIME', 'nodejs');
        const { register } = await import('./instrumentation');
        await register();
        expect(initializeCron).toHaveBeenCalled();
    });

    it('ne fait rien en périphérie, où node-cron n’existe pas', async () => {
        vi.stubEnv('NEXT_RUNTIME', 'edge');
        const { register } = await import('./instrumentation');
        await register();
        expect(initializeCron).not.toHaveBeenCalled();
    });
});
