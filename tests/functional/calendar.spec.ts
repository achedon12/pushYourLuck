import { expect, test } from '@playwright/test';
import { seedTestDatabase, FIXTURE_PLAYERS, FIXTURE_PREVIOUS_MONTH } from '../fixtures';

/** Mois « YYYY-MM » décalé de `delta` par rapport à aujourd'hui, heure de Paris. */
function monthOffset(delta: number): string {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

test.describe('calendrier des meilleurs scores', () => {
    test.beforeAll(() => seedTestDatabase());

    test('affiche le meilleur score du jour et ses manches', async ({ page }) => {
        await page.goto('/classement');
        // Un <section> sans nom accessible n'expose pas le rôle « region » :
        // on cible la balise directement.
        const calendar = page.locator('section').filter({ hasText: 'Calendrier des meilleurs scores' });

        await expect(calendar.getByText(String(FIXTURE_PLAYERS[0].score)).first()).toBeVisible();
        // Les manches encaissées, soit une de moins que la manche en cours à la
        // fin de la partie.
        await expect(calendar.getByText(`${FIXTURE_PLAYERS[0].rounds - 1} m.`).first()).toBeVisible();
    });

    test('remonte le temps jusqu’au mois du plus ancien score', async ({ page }) => {
        await page.goto('/classement');
        await page.getByRole('link', { name: 'Mois précédent' }).click();

        await expect(page).toHaveURL(/\?mois=\d{4}-\d{2}$/);
        await expect(page.getByRole('link', { name: 'Revenir au mois en cours' })).toBeVisible();
    });

    test('atteint le mois qui contient le score le plus ancien', async ({ page }) => {
        // On y va par l'URL plutôt qu'en enchaînant les clics : chaque clic
        // provoque une navigation, et réutiliser le lien d'avant le fait
        // disparaître du DOM en cours de route.
        await page.goto(`/classement?mois=${monthOffset(-2)}`);
        await expect(page.getByText(String(FIXTURE_PREVIOUS_MONTH.score)).first()).toBeVisible();
    });

    test('ne laisse pas remonter avant le premier score enregistré', async ({ page }) => {
        await page.goto(`/classement?mois=${monthOffset(-2)}`);
        // Arrivé à la borne, la flèche devient inerte : elle n'est plus un lien.
        await expect(page.getByRole('link', { name: 'Mois précédent' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Mois suivant' })).toBeVisible();
    });

    test('ne propose jamais d’aller dans le futur', async ({ page }) => {
        await page.goto('/classement');
        await expect(page.getByRole('link', { name: 'Mois suivant' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Année suivante' })).toHaveCount(0);
    });

    test('ramène au mois courant', async ({ page }) => {
        await page.goto('/classement?mois=2020-01');
        // Un mois hors bornes est ramené dans l'intervalle plutôt que de rendre
        // une page vide.
        await expect(page.getByRole('heading', { name: 'Classement du jour' })).toBeVisible();
    });

    test('utilise un paramètre traduit en anglais', async ({ page }) => {
        await page.goto('/en/leaderboard');
        await page.getByRole('link', { name: 'Previous month' }).click();
        await expect(page).toHaveURL(/\?month=\d{4}-\d{2}$/);
    });
});
