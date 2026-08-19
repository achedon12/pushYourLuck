import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Client Prisma généré : pas notre code, et il ne passe pas nos règles.
    "src/generated/**",
    // Bind mounts MySQL : appartiennent à l'uid du conteneur, illisibles ici —
    // sans cette ligne ESLint s'arrête sur un EACCES.
    "mysql-data/**",
    "mysql-data-dev/**",
  ]),
]);

export default eslintConfig;
