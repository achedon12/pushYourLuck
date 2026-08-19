# CLAUDE.md

Guide pour travailler sur ce dépôt. Voir `README.md` pour le démarrage.

Les consignes sont découpées en fichiers thématiques sous `.claude/rules/` et
importées ci-dessous. Chaque fichier est un bloc autonome, pour qu'un
sous-agent ou un `/compact` puisse n'en charger qu'une partie.

## Le projet en un paragraphe

Application Next.js 16 (App Router, TypeScript, Tailwind v4) servant un unique
jeu de cartes solo sur le port **3001**. Prisma 7 → MySQL 8.4, client **généré**
sous `src/generated/prisma` (`npx prisma generate` est un prérequis de `dev` et
`build`). Interface et copie **en français**, anglais préfixé. Trois couches de
tests, toutes obligatoires : **unitaire** (Vitest), **fonctionnel** et
**visuel** (Playwright, sur une base dédiée `pushyourluck_test`). `npm test`
lance tout. S'y ajoute `npm run sim`, qui mesure la dérive d'équilibrage plutôt
qu'une régression. Le déterminisme du moteur est la clef de voûte : il donne la
partie du jour commune, la validation anti-triche par rejeu, et l'équilibrage
par simulation.

## Fichiers de règles

@.claude/rules/01-architecture.md
@.claude/rules/02-i18n.md
@.claude/rules/03-design.md
@.claude/rules/04-balance.md
@.claude/rules/05-conventions.md
@.claude/rules/06-tests.md
@.claude/rules/07-migrations.md
@.claude/rules/08-api-security.md
@.claude/rules/09-ops.md
@.claude/rules/10-gotchas.md
@.claude/rules/11-comments.md
