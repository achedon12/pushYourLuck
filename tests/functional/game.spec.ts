import { expect, test, type Page } from '@playwright/test';

/**
 * Parcours de jeu. Ces cas ne dupliquent pas les tests unitaires du moteur :
 * ils vérifient la COUTURE entre le moteur, l'état React et l'écran — l'endroit
 * exact où les bugs rencontrés jusqu'ici se sont logés.
 */

async function startFreeGame(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /Partie libre/ }).click();
    await expect(page.getByRole('button', { name: /^Tirer/ })).toBeVisible();
}

/**
 * Tire jusqu'à pouvoir encaisser, et relance une partie si les bombes ont eu
 * raison des trois vies.
 *
 * Le paquet du mode libre est aléatoire : une suite de tirages fixe finit
 * toujours par produire un test qui échoue sans qu'aucun bug n'existe.
 */
async function drawUntilBankable(page: Page) {
    const bank = page.getByRole('button', { name: /^Encaisser/ });
    const replay = page.getByRole('button', { name: 'Rejouer' });

    for (let i = 0; i < 60; i++) {
        if (await bank.isEnabled().catch(() => false)) return;
        if (await replay.isVisible().catch(() => false)) {
            await startFreeGame(page);
            continue;
        }
        await page.keyboard.press('Space');
        // La fin de partie n'affiche son récapitulatif qu'après une animation :
        // pendant ce délai le plateau est encore là mais n'accepte plus rien.
        // Sans cette pause, la boucle tourne à vide et épuise son budget.
        await page.waitForTimeout(60);
    }

    throw new Error('impossible d’atteindre un pot encaissable en 60 tirages');
}

test.describe('parcours de jeu', () => {
    test('l’écran d’accueil propose les deux modes', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: /Partie du jour/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Partie libre/ })).toBeVisible();
    });

    test('démarre sur un paquet de 26 cartes et un pot vide', async ({ page }) => {
        await startFreeGame(page);
        await expect(page.getByText('26 cartes · 5 bombes')).toBeVisible();
        await expect(page.getByText('Tire une carte pour ouvrir le pot')).toBeVisible();
        // Encaisser n'a aucun sens avec un pot vide.
        await expect(page.getByRole('button', { name: /^Encaisser/ })).toBeDisabled();
    });

    test('tirer consomme une carte, ou fait sauter la manche', async ({ page }) => {
        await startFreeGame(page);
        await page.getByRole('button', { name: /^Tirer/ }).click();

        // Le paquet du mode libre est tiré au hasard : une bombe sort au premier
        // tirage environ une fois sur cinq, et le paquet revient alors à 26
        // cartes avec une vie en moins. Le test doit accepter les deux issues,
        // sinon il échoue un jour sur cinq sans qu'aucun bug n'existe.
        await expect(page.getByText(/25 cartes ·|Manche 2/)).toBeVisible();
    });

    test('la barre d’espace tire, la touche E encaisse', async ({ page }) => {
        await startFreeGame(page);
        await page.keyboard.press('Space');
        await expect(page.getByText(/25 cartes ·|Manche 2/)).toBeVisible();

        await drawUntilBankable(page);
        await page.keyboard.press('e');
        await expect(page.getByText('Manche encaissée')).toBeVisible();
    });

    test('encaisser ouvre une boutique de trois cartes, que l’on peut passer', async ({ page }) => {
        await startFreeGame(page);
        await drawUntilBankable(page);
        await page.getByRole('button', { name: /^Encaisser/ }).click();

        const shop = page.getByText('Manche encaissée');
        await expect(shop).toBeVisible();
        await expect(page.getByRole('button', { name: 'Passer' })).toBeVisible();

        await page.getByRole('button', { name: 'Passer' }).click();
        await expect(shop).toBeHidden();
        await expect(page.getByText('Manche 2')).toBeVisible();
    });

    test('la partie se termine et affiche le récapitulatif', async ({ page }) => {
        // Trois bombes sont nécessaires pour finir : la boucle est longue par
        // nature, le délai par défaut de 30 s ne suffit pas.
        test.setTimeout(120_000);
        await startFreeGame(page);

        const replay = page.getByRole('button', { name: 'Rejouer' });
        const skip = page.getByRole('button', { name: 'Passer' });

        for (let i = 0; i < 200; i++) {
            if (await replay.isVisible().catch(() => false)) break;
            if (await skip.isVisible().catch(() => false)) {
                await skip.click();
                continue;
            }
            // Le clavier évite un aller-retour de résolution de sélecteur par
            // tirage, ce qui divise la durée de la boucle.
            await page.keyboard.press('Space');
        }

        await expect(page.getByRole('button', { name: 'Rejouer' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Partager' })).toBeVisible();
    });

    test('le son se coupe et le réglage survit au rechargement', async ({ page }) => {
        await startFreeGame(page);
        await page.getByRole('button', { name: 'Couper le son' }).click();
        await expect(page.getByRole('button', { name: 'Activer le son' })).toBeVisible();

        await page.reload();
        await page.getByRole('button', { name: /Partie libre/ }).click();
        await expect(page.getByRole('button', { name: 'Activer le son' })).toBeVisible();
    });
});
