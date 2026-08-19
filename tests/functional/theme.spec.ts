import { expect, test } from '@playwright/test';

test.describe('thème clair et sombre', () => {
    test('bascule et se souvient du choix après rechargement', async ({ page }) => {
        await page.goto('/');
        const root = page.locator('html');

        // Aucun choix explicite au départ : c'est le réglage système qui décide,
        // donc l'attribut est absent.
        await expect(root).not.toHaveAttribute('data-theme', /.+/);

        await page.getByRole('button', { name: 'Changer de thème' }).click();
        const chosen = await root.getAttribute('data-theme');
        expect(chosen).toMatch(/^(light|dark)$/);

        await page.reload();
        // Posé par le script d'amorçage AVANT la première peinture : c'est ce
        // qui évite le clignotement d'un thème à l'autre.
        await expect(root).toHaveAttribute('data-theme', chosen!);
    });

    test('le choix survit à un changement de page', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Changer de thème' }).click();
        const chosen = await page.locator('html').getAttribute('data-theme');

        await page.goto('/regles');
        await expect(page.locator('html')).toHaveAttribute('data-theme', chosen!);
    });

    test('applique réellement des couleurs différentes', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
        const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

        await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
        const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

        expect(light).not.toBe(dark);
    });
});
