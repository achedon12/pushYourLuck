import { expect, test } from '@playwright/test';
import { seedTestDatabase, FIXTURE_PLAYERS, FIXTURE_FREE_RECORDS, SITE_ORIGIN } from '../fixtures';
import { createRun, draw, bank, chooseOffer, readDeck } from '../../src/games/push-your-luck/engine';
import { dailySeed } from '../../src/lib/daily';

/**
 * Le moteur est importé pour FABRIQUER une partie valide — c'est le seul moyen
 * d'éprouver la chaîne complète (rejeu serveur, contrainte d'unicité,
 * classement) sans jouer trois cents clics à chaque exécution.
 */
function playRun(seed: number, threshold: number): string {
    let state = createRun(seed);
    let actions = '';

    for (let i = 0; i < 2000 && state.phase !== 'over'; i++) {
        if (state.phase === 'shop') {
            state = chooseOffer(state, null);
            actions += 's';
            continue;
        }
        if (state.pot > 0 && readDeck(state).bustChance > threshold) {
            state = bank(state);
            actions += 'b';
        } else {
            state = draw(state);
            actions += 'd';
        }
    }
    return actions;
}

const submit = (body: Record<string, unknown>) => ({
    data: body,
    // `Origin` n'est pas décoratif : la route refuse une écriture qui ne vient
    // pas du site. Un navigateur le pose seul, un client d'API doit l'imiter.
    headers: { 'Content-Type': 'application/json', Origin: SITE_ORIGIN },
});

test.describe('envoi d’un score', () => {
    test.beforeEach(() => seedTestDatabase());

    test('accepte une partie réellement jouée et la classe', async ({ request }) => {
        const actions = playRun(dailySeed(), 0.24);

        const response = await request.post('/api/scores', submit({
            mode: 'daily', name: 'Éliane', clientId: 'functional-client-0001', actions,
        }));

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.saved).toBe(true);
        expect(body.score).toBeGreaterThanOrEqual(0);

        const board = await (await request.get('/api/scores?mode=daily&limit=100')).json();
        expect(board.scores.map((s: { name: string }) => s.name)).toContain('Éliane');
    });

    test('refuse un pseudo interdit AVANT d’écrire quoi que ce soit', async ({ request }) => {
        const before = await (await request.get('/api/scores?mode=daily&limit=100')).json();

        const response = await request.post('/api/scores', submit({
            mode: 'daily', name: 'connard', clientId: 'functional-client-0002', actions: playRun(dailySeed(), 0.24),
        }));

        expect(response.status()).toBe(422);
        await expect(response.json()).resolves.toEqual({ error: 'blocked_name' });

        const after = await (await request.get('/api/scores?mode=daily&limit=100')).json();
        expect(after.scores).toHaveLength(before.scores.length);
    });

    test('refuse une suite d’actions inventée', async ({ request }) => {
        const response = await request.post('/api/scores', submit({
            mode: 'daily', name: 'Faussaire', clientId: 'functional-client-0003', actions: 'bbbbbb',
        }));

        expect(response.status()).toBe(422);
        await expect(response.json()).resolves.toEqual({ error: 'replay_rejected' });
    });

    test('ne garde qu’un score par joueur et par jour — le meilleur', async ({ request }) => {
        const client = 'functional-client-0004';
        const good = playRun(dailySeed(), 0.24);
        const timid = playRun(dailySeed(), 0.01);

        const first = await (await request.post('/api/scores', submit({
            mode: 'daily', name: 'Fabien', clientId: client, actions: good,
        }))).json();

        const second = await (await request.post('/api/scores', submit({
            mode: 'daily', name: 'Fabien', clientId: client, actions: timid,
        }))).json();

        // La seconde partie est plus prudente, donc plus faible : elle ne doit
        // pas écraser la première.
        expect(second.score).toBeLessThanOrEqual(first.score);
        if (second.score < first.score) expect(second.saved).toBe(false);

        const board = await (await request.get('/api/scores?mode=daily&limit=100')).json();
        expect(board.scores.filter((s: { name: string }) => s.name === 'Fabien')).toHaveLength(1);
    });

    test('le classement du jour est trié par score décroissant', async ({ request }) => {
        const board = await (await request.get('/api/scores?mode=daily&limit=100')).json();
        const scores = board.scores.map((s: { score: number }) => s.score);
        expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a));
        expect(scores[0]).toBe(FIXTURE_PLAYERS[0].score);
    });

    test('les records en partie libre ne gardent qu’une ligne par pseudo', async ({ page }) => {
        // Les fixtures contiennent « Achedon » et « achedon » sous deux
        // identifiants de navigateur : une seule ligne doit rester, la
        // meilleure, et le nombre de manches doit être affiché comme dans le
        // classement du jour.
        await page.goto('/classement');
        const records = page.locator('section').filter({ hasText: 'Records en partie libre' });

        await expect(records.getByRole('listitem').filter({ hasText: /achedon/i })).toHaveCount(1);
        await expect(records.getByText(String(FIXTURE_FREE_RECORDS[0].score))).toBeVisible();
        await expect(records.getByText(String(FIXTURE_FREE_RECORDS[1].score))).toHaveCount(0);
        await expect(records.getByText(`${FIXTURE_FREE_RECORDS[0].rounds - 1} manches`)).toBeVisible();
    });

    test('la page classement affiche les scores envoyés', async ({ page, request }) => {
        await request.post('/api/scores', submit({
            mode: 'daily', name: 'Gwendoline', clientId: 'functional-client-0005', actions: playRun(dailySeed(), 0.24),
        }));

        await page.goto('/classement');
        await expect(page.getByText('Gwendoline')).toBeVisible();
    });
});
