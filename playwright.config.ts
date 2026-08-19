import { defineConfig, devices } from '@playwright/test';

// L'URL est recopiée ici plutôt qu'importée : tout module importé par cette
// configuration est chargé en CommonJS, ce qui exclut le client Prisma et donc
// le fichier de fixtures s'il venait à l'importer.
const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    'mysql://pushyourluck:pushyourluck@127.0.0.1:3307/pushyourluck_test';

const PORT = Number(process.env.TEST_PORT ?? 3002);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Deux couches au-dessus des tests unitaires :
 *
 *   - `fonctionnel` pilote l'application réelle (serveur Next + MySQL) et
 *     vérifie des PARCOURS : jouer, encaisser, envoyer un score, changer de
 *     langue. C'est ce qu'aucun test unitaire ne peut couvrir, parce que le bug
 *     s'y loge dans la couture entre les couches.
 *   - `visuel` compare des captures d'écran de référence. Il n'affirme rien sur
 *     le comportement : il détecte qu'un thème, une marge ou une police a bougé
 *     sans qu'on l'ait voulu.
 *
 * Les deux tournent sur une base DÉDIÉE (`pushyourluck_test`), jamais celle de
 * développement.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? 'list' : [['list']],

    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        locale: 'fr-FR',
        timezoneId: 'Europe/Paris',
    },

    projects: [
        {
            name: 'fonctionnel',
            testDir: './tests/functional',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'visuel',
            testDir: './tests/visual',
            use: {
                ...devices['Desktop Chrome'],
                // Fenêtre figée : une capture ne veut rien dire si la largeur
                // dépend de la machine qui la produit.
                viewport: { width: 1000, height: 900 },
                deviceScaleFactor: 1,
            },
        },
    ],

    expect: {
        toHaveScreenshot: {
            // Marge minimale : elle absorbe l'anticrénelage des polices d'une
            // machine à l'autre sans laisser passer un vrai changement de mise
            // en page.
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
    },

    webServer: {
        // Build de production plutôt que serveur de développement : le mode dev
        // refuse une seconde instance sur le même dossier, affiche son propre
        // indicateur — qui apparaîtrait sur chaque capture — et ne reflète pas
        // ce qui est déployé.
        command: `npm run build && npx next start -p ${PORT}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        env: {
            // Écrase le `.env` : Next ne remplace jamais une variable déjà
            // présente dans l'environnement, donc la base de test gagne.
            DATABASE_URL: TEST_DATABASE_URL,
            NEXT_PUBLIC_SITE_URL: BASE_URL,
            // Aucune mesure d'audience pendant les tests.
            NEXT_PUBLIC_MATOMO_URL: '',
            NEXT_PUBLIC_MATOMO_SITE_ID: '',
            NEXT_DISABLE_STANDALONE: '1',
        },
    },
});
