import { expect, test } from '@playwright/test';

/**
 * Un nom accessible se perd par le CSS, pas par le code — et c'est ce qui rend
 * la panne invisible en développement.
 *
 * Le nom du site dans l'en-tête est masqué sous 480 px (`max-[479px]:hidden`)
 * et l'icône qui reste est `aria-hidden` : le lien du logo n'avait donc plus
 * aucun nom sur mobile, alors qu'il en gardait un sur un écran large. Ni le
 * typage, ni les tests unitaires, ni un coup d'œil au composant ne pouvaient le
 * montrer. PageSpeed, lui, l'a signalé en `link-name`.
 *
 * D'où des assertions posées à une LARGEUR MOBILE explicite : c'est la largeur
 * qui décide, pas le balisage.
 */
const MOBILE = { width: 412, height: 915 };

test.describe('noms accessibles à largeur mobile', () => {
    test.use({ viewport: MOBILE });

    test('le lien du logo garde un nom quand la marque est masquée', async ({ page }) => {
        await page.goto('/');

        const brand = page.locator('header').getByRole('link', { name: /Push Your Luck/i });
        await expect(brand).toHaveCount(1);
        await expect(brand).toHaveAttribute('href', '/');
    });

    test('les commandes réduites à une icône sont nommées', async ({ page }) => {
        await page.goto('/');

        // Bascule de langue et de thème : deux carrés de 32 px sans texte
        // visible. Sans nom accessible, un lecteur d'écran n'annonce que
        // « lien » et « bouton ».
        await expect(page.getByRole('link', { name: 'Switch to English' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Changer de thème' })).toBeVisible();
    });

    test('aucun lien de la page n’est dépourvu de nom', async ({ page }) => {
        await page.goto('/');

        // Reprend le critère d'axe utilisé par PageSpeed : un lien est nommé
        // par son texte, son `aria-label`, son `aria-labelledby` ou son
        // `title`. On balaie toute la page pour ne pas se limiter à l'en-tête.
        const unnamed = await page.locator('a[href]').evaluateAll((links) =>
            links
                .filter((link) => {
                    const el = link as HTMLAnchorElement;
                    const named =
                        (el.textContent ?? '').trim() !== '' ||
                        (el.getAttribute('aria-label') ?? '').trim() !== '' ||
                        (el.getAttribute('aria-labelledby') ?? '').trim() !== '' ||
                        (el.getAttribute('title') ?? '').trim() !== '';
                    return !named;
                })
                .map((el) => (el as HTMLAnchorElement).outerHTML.slice(0, 120)),
        );

        expect(unnamed, `liens sans nom accessible : ${unnamed.join(' | ')}`).toEqual([]);
    });
});
