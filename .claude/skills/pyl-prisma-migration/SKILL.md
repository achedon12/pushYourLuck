---
name: pyl-prisma-migration
description: Use when changing the database schema — adding or removing a model, column, index, default or relation. Drives the Prisma 7 + MySQL migration flow for this project, where production applies migrations from the container entrypoint and `db push` is banned.
---

# Changer le schéma

## Spécificités du projet

- **Schéma** : `prisma/schema.prisma`. L'URL n'y est **pas** déclarée — elle
  vit dans `prisma.config.ts`.
- **Client généré**, pas installé : sous `src/generated/prisma`. Après tout
  changement, `npx prisma generate`, sinon les erreurs de typage sur un champ
  sont des mensonges.
- **MySQL 8.4** via l'adaptateur `@prisma/adapter-mariadb`.
- **`prisma db push` est proscrit** : il pose un schéma sans laisser de trace,
  donc sans moyen de le rejouer. C'est ce qui a mis en ligne une production
  sans table `Score`.

## Procédure

```bash
npm run db:migrate            # prisma migrate dev — crée et applique
npx prisma generate           # le client suit le schéma
npx prisma migrate status     # « Database schema is up to date! »
npm test                      # la base de test est rejouée depuis le vide
```

`scripts/setup-test-db.sh` **détruit** `pushyourluck_test` et rejoue toutes les
migrations : la suite fonctionnelle tourne donc sur un schéma construit par tes
migrations. Une migration cassée se voit au premier `npm test`.

## Une seule migration par livraison

Si `migrate dev` en a produit plusieurs, fusionne-les avant de commiter :
concatène les `migration.sql` dans le dossier de la première, supprime les
autres, puis réconcilie la base locale avec
`npx prisma migrate resolve --applied <migration_fusionnée>`.

Procédure détaillée et garde-fous : `.claude/rules/07-migrations.md`.

## En production

`docker-entrypoint.sh` lance `migrate deploy` **avant** de démarrer Next. Si la
migration échoue, le conteneur s'arrête — délibérément : Next démarre très bien
sur une base sans table, le healthcheck passe, et la panne n'apparaît qu'à la
première requête d'un visiteur.

Rien à lancer à la main : `docker compose -p pushyourluck up -d --build` suffit.

## À ne jamais faire

- Modifier une migration déjà déployée (le checksum change → Prisma refuse la
  base). Corrige par une nouvelle migration.
- `prisma migrate reset` sur autre chose qu'une base jetable.
- Empiler des changements risqués dans une seule migration : **MySQL n'a pas de
  DDL transactionnel**, un échec à mi-course laisse la base à moitié
  transformée et marquée `failed`.
