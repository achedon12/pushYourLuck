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

    /**
     * Le jeu se joue au pouce : tout ce qui sert à décider — jauge de risque,
     * carte, pot, boutons, composition du paquet — doit tenir dans l'écran.
     * Avant, il fallait faire défiler la page pour atteindre « Encaisser », le
     * temps que le décor éditorial passe. Les hauteurs choisies sont celles de
     * deux téléphones réels, pas des valeurs rondes : un iPhone SE (375 × 667)
     * et le plus petit écran encore en circulation (320 × 568).
     */
    for (const [width, height] of [[375, 667], [320, 568]] as const) {
        test(`la partie tient dans l’écran sans défiler à ${width} × ${height}`, async ({ page }) => {
            await page.setViewportSize({ width, height });
            await page.goto('/');
            await page.getByRole('button', { name: /Partie libre/ }).click();
            await expect(page.getByRole('button', { name: /Tirer/ })).toBeVisible();

            const bottoms = await page.evaluate(() => {
                const byText = (re: RegExp, sel: string) =>
                    [...document.querySelectorAll(sel)].find((e) => re.test(e.textContent ?? ''));
                const bottom = (e: Element | undefined) =>
                    e ? Math.round(e.getBoundingClientRect().bottom) : Number.POSITIVE_INFINITY;
                return {
                    viewport: window.innerHeight,
                    bank: bottom(byText(/Encaisser/, 'button')),
                    deck: bottom(byText(/Paquet restant/, 'section')),
                };
            });

            expect(bottoms.bank, 'le bouton Encaisser sort de l’écran').toBeLessThanOrEqual(bottoms.viewport);
            expect(bottoms.deck, 'la composition du paquet sort de l’écran').toBeLessThanOrEqual(bottoms.viewport);
        });
    }

    test('plateau de jeu lisible à 320 px', async ({ page }) => {
        // Hauteur d'un vrai téléphone, et capture de la SEULE fenêtre visible :
        // le plateau occupe l'écran sur mobile, une capture pleine page y
        // ajouterait le contenu éditorial qui défile derrière lui et ne
        // montrerait plus ce que le joueur a réellement sous les yeux.
        await page.setViewportSize({ width: 320, height: 568 });
        await page.addInitScript(() => localStorage.setItem('pyl.theme', 'dark'));
        await page.goto('/');
        await page.getByRole('button', { name: /Partie libre/ }).click();
        await expect(page.getByText('26 cartes · 5 bombes')).toBeVisible();

        await expect(page).toHaveScreenshot('plateau-320.png');
    });
});
