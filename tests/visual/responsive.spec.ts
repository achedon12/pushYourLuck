import { expect, test } from '@playwright/test';

/**
 * Le responsive est la seule chose que ni un test unitaire ni un test
 * fonctionnel ne peuvent attraper : une mise en page qui déborde reste
 * parfaitement cliquable.
 */
const WIDTHS = [320, 375, 430] as const;
const PAGES = [
    { url: '/', name: 'accueil' },
    { url: '/regles', name: 'regles' },
] as const;

test.describe('largeurs mobiles', () => {
    for (const width of WIDTHS) {
        test(`aucun débordement horizontal à ${width} px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });

            for (const target of PAGES) {
                await page.goto(target.url);
                const overflow = await page.evaluate(() => ({
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: document.documentElement.clientWidth,
                }));
                expect(
                    overflow.scrollWidth,
                    `${target.url} déborde de ${overflow.scrollWidth - overflow.clientWidth} px`,
                ).toBeLessThanOrEqual(overflow.clientWidth);
            }
        });
    }

    test('plateau de jeu lisible à 320 px', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 900 });
        await page.addInitScript(() => localStorage.setItem('pyl.theme', 'dark'));
        await page.goto('/');
        await page.getByRole('button', { name: /Partie libre/ }).click();
        await expect(page.getByText('26 cartes · 5 bombes')).toBeVisible();

        await expect(page).toHaveScreenshot('plateau-320.png', { fullPage: true });
    });
});
