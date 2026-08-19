import { expect, test } from '@playwright/test';

/**
 * Le référencement se vérifie sur le HTML RÉELLEMENT servi : les tests
 * unitaires valident l'objet de métadonnées, pas ce que Next en fait.
 */
test.describe('référencement', () => {
    test('pose une canonique et des hreflang réciproques', async ({ page }) => {
        await page.goto('/regles');

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/regles$/);
        await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/regles$/);
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/rules$/);
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', /\/regles$/);
    });

    test('n’affiche jamais la marque en double dans le titre', async ({ page }) => {
        await page.goto('/');
        expect((await page.title()).match(/Push Your Luck/g)).toHaveLength(1);

        await page.goto('/regles');
        await expect(page).toHaveTitle('Règles du jeu — Push Your Luck');
    });

    test('expose un plan du site couvrant les deux langues', async ({ request }) => {
        const sitemap = await (await request.get('/sitemap.xml')).text();
        expect(sitemap).toContain('/regles');
        expect(sitemap).toContain('/en/rules');
        expect(sitemap).toContain('hreflang="x-default"');
    });

    test('autorise l’indexation et interdit l’API dans robots.txt', async ({ request }) => {
        const robots = await (await request.get('/robots.txt')).text();
        expect(robots).toContain('Allow: /');
        expect(robots).toContain('Disallow: /api/');
        expect(robots).toContain('Sitemap:');
    });

    test('publie les données structurées attendues', async ({ page }) => {
        await page.goto('/regles');
        const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
        const types = blocks.flatMap((block) => [...block.matchAll(/"@type":"(\w+)"/g)].map((m) => m[1]));

        expect(types).toEqual(expect.arrayContaining(['WebSite', 'VideoGame', 'FAQPage', 'BreadcrumbList']));
    });

    test('sert une vignette de partage par langue', async ({ page, request }) => {
        await page.goto('/');
        // Next émet plusieurs balises og:image (url, type, dimensions) : on ne
        // lit que la première.
        const french = await page.locator('meta[property="og:image"]').first().getAttribute('content');
        await page.goto('/en');
        const english = await page.locator('meta[property="og:image"]').first().getAttribute('content');

        expect(french).not.toBe(english);
        expect((await request.get(french!)).headers()['content-type']).toContain('image/png');
    });

    test('déclare un manifeste et une icône', async ({ request }) => {
        expect((await request.get('/manifest.webmanifest')).ok()).toBe(true);
        expect((await request.get('/icon.png')).headers()['content-type']).toContain('image/png');
        expect((await request.get('/favicon.ico')).ok()).toBe(true);
    });
});
