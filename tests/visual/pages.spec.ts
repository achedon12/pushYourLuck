import { expect, test, type Page } from '@playwright/test';
import { seedTestDatabase } from '../fixtures';

/**
 * Tests visuels : ils n'affirment rien sur le comportement, ils détectent qu'un
 * thème, une marge ou une police a bougé sans qu'on l'ait voulu — la seule
 * chose qu'aucun test fonctionnel ne voit.
 *
 * Deux conditions pour qu'ils soient utiles plutôt qu'agaçants :
 *   - la page doit être DÉTERMINISTE : données figées par les fixtures, et
 *     zones dépendant de la date explicitement masquées ;
 *   - les animations sont désactivées à la capture (voir playwright.config).
 *
 * Après un changement de design volontaire : `npm run test:visual:update`.
 */

/** Force un thème via le stockage local, comme le ferait un vrai visiteur. */
async function withTheme(page: Page, theme: 'light' | 'dark') {
    await page.addInitScript((value) => {
        localStorage.setItem('pyl.theme', value);
    }, theme);
}

const THEMES = ['light', 'dark'] as const;

test.describe('captures de référence', () => {
    test.beforeAll(() => seedTestDatabase());

    for (const theme of THEMES) {
        test(`règles — thème ${theme}`, async ({ page }) => {
            await withTheme(page, theme);
            await page.goto('/regles');
            await expect(page).toHaveScreenshot(`regles-${theme}.png`, { fullPage: true });
        });

        test(`accueil — thème ${theme}`, async ({ page }) => {
            await withTheme(page, theme);
            await page.goto('/');
            // La date du jour change chaque nuit : elle est masquée, pas exclue
            // de la page, pour que sa PLACE reste comparée.
            await expect(page).toHaveScreenshot(`accueil-${theme}.png`, {
                fullPage: true,
                mask: [page.getByTestId('daily-date')],
            });
        });
    }

    test('plateau de jeu au premier tour', async ({ page }) => {
        await withTheme(page, 'dark');
        await page.goto('/');
        await page.getByRole('button', { name: /Partie libre/ }).click();

        // Avant le premier tirage, le plateau est identique quelle que soit la
        // graine : paquet de départ complet, pot vide, carte face cachée.
        await expect(page.getByText('26 cartes · 5 bombes')).toBeVisible();
        await expect(page).toHaveScreenshot('plateau-premier-tour.png', { fullPage: true });
    });

    test('classement avec ses fixtures', async ({ page }) => {
        await withTheme(page, 'light');
        await page.goto('/classement');
        await expect(page).toHaveScreenshot('classement-light.png', {
            fullPage: true,
            // Le calendrier entoure le jour courant : sa position se déplace
            // chaque jour, ce qui rendrait la capture caduque du jour au
            // lendemain. Il a ses propres tests fonctionnels.
            mask: [page.getByTestId('leaderboard-date'), page.getByTestId('calendar')],
        });
    });

    test('nouveautés', async ({ page }) => {
        await withTheme(page, 'light');
        await page.goto('/nouveautes');
        await expect(page).toHaveScreenshot('nouveautes-light.png', { fullPage: true });
    });

    test('confidentialité', async ({ page }) => {
        await withTheme(page, 'dark');
        await page.goto('/confidentialite');
        await expect(page).toHaveScreenshot('confidentialite-dark.png', { fullPage: true });
    });

    test('règles en anglais', async ({ page }) => {
        await withTheme(page, 'light');
        await page.goto('/en/rules');
        await expect(page).toHaveScreenshot('regles-en-light.png', { fullPage: true });
    });
});
