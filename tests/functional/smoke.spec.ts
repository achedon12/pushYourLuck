import { expect, test } from '@playwright/test';
import { seedTestDatabase, FIXTURE_PLAYERS } from '../fixtures';

/**
 * Vérifie d'abord le harnais lui-même : si les tests tapaient sur la base de
 * développement, tous les autres résultats seraient trompeurs.
 */
test.describe('harnais de test', () => {
    test.beforeAll(() => seedTestDatabase());

    test('le serveur répond et parle à la base de TEST', async ({ page, request }) => {
        const health = await request.get('/api/health');
        expect(health.ok()).toBe(true);
        await expect(health.json()).resolves.toMatchObject({ status: 'ok', db: 'up' });

        const board = await (await request.get('/api/scores?mode=daily&limit=100')).json();
        expect(board.scores).toHaveLength(FIXTURE_PLAYERS.length);

        await page.goto('/classement');
        await expect(page.getByText(FIXTURE_PLAYERS[0].name)).toBeVisible();
        // La base de dev contient « Alice » et des centaines d'autres scores :
        // les voir ici signifierait que le serveur vise la mauvaise base.
        await expect(page.getByText('Alice')).toHaveCount(0);
    });
});
