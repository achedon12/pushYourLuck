import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Vite résout nativement les alias de tsconfig.json : sans ça, chaque test
    // devrait importer par chemin relatif et diverger du code de production.
    resolve: { tsconfigPaths: true },
    test: {
        environment: 'node',
        // Les tests vivent à côté du code qu'ils couvrent : la règle « une
        // fonctionnalité = un test » se vérifie d'un coup d'œil sur le dossier.
        include: ['src/**/*.test.ts'],
        restoreMocks: true,
    },
});
