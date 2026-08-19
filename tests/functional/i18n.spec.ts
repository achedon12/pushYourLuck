import { expect, test } from '@playwright/test';

/**
 * L'internationalisation repose sur deux layouts racine et une table d'URL.
 * Ces cas vérifient ce qu'aucun test unitaire ne voit : que le HTML servi
 * porte la bonne langue et que la bascule ne fait pas perdre sa page.
 */
test.describe('deux langues', () => {
    test('sert le français sans préfixe et l’anglais préfixé', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Push Your Luck');

        await page.goto('/en');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        // Le libellé apparaît aussi dans le pied de page et dans le corps du
        // texte : on vise la navigation principale.
        await expect(
            page.getByLabel('Main navigation').getByRole('link', { name: 'Leaderboard' }),
        ).toBeVisible();
    });

    test('traduit les slugs, pas seulement le texte', async ({ page }) => {
        await page.goto('/regles');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Règles du jeu');

        await page.goto('/en/rules');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Game rules');
    });

    test('la bascule de langue conserve la page courante', async ({ page }) => {
        await page.goto('/classement');
        await page.getByRole('link', { name: 'Switch to English' }).click();

        // Le point du test : on arrive sur le CLASSEMENT anglais, pas sur
        // l'accueil — c'est le défaut le plus courant des sélecteurs de langue.
        await expect(page).toHaveURL(/\/en\/leaderboard$/);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Daily leaderboard');

        await page.getByRole('link', { name: 'Passer en français' }).click();
        await expect(page).toHaveURL(/\/classement$/);
    });

    test('traduit le contenu du jeu, cartes comprises', async ({ page }) => {
        await page.goto('/en/rules');
        // Le nom de carte est un en-tête de ligne (`<th scope="row">`), donc de
        // rôle `rowheader` et non `cell`.
        await expect(page.getByRole('rowheader', { name: 'Wire cutters' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Removes a bomb from the deck' })).toBeVisible();

        await page.goto('/regles');
        await expect(page.getByRole('rowheader', { name: 'Pince coupante' })).toBeVisible();
    });

    test('sert les pages légales dans les deux langues', async ({ page }) => {
        for (const [url, heading] of [
            ['/mentions-legales', 'Mentions légales'],
            ['/confidentialite', 'Politique de confidentialité'],
            ['/en/legal-notice', 'Legal notice'],
            ['/en/privacy', 'Privacy policy'],
            ['/nouveautes', 'Nouveautés'],
            ['/en/changelog', 'Changelog'],
        ] as const) {
            await page.goto(url);
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
        }
    });
});
