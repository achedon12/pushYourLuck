# Migrations — une seule par livraison, jamais de `db push`

Le schéma de production est décrit **par les fichiers de `prisma/migrations/`,
et par rien d'autre**. `prisma db push` est proscrit : il pose un schéma sans
laisser de trace, donc sans moyen de le rejouer ailleurs. C'est exactement ce
qui a mis en ligne une production sans table `Score`, où chaque page tombait sur
« The table `Score` does not exist » alors que la base était parfaitement saine.

```bash
npm run db:migrate     # prisma migrate dev — crée la migration et l'applique en local
npx prisma migrate status   # doit dire « Database schema is up to date! »
```

## Qui les applique, et quand

| Environnement | Mécanisme |
|---|---|
| Développement | `npm run db:migrate` à la main |
| Tests | `scripts/setup-test-db.sh` **détruit** `pushyourluck_test` et rejoue tout depuis le vide |
| Production | `docker-entrypoint.sh` lance `migrate deploy` **avant** de démarrer Next |

La base de test est reposée à neuf plutôt que conservée : les 59 tests
Playwright tournent donc sur un schéma construit par les migrations, pas par une
projection du schéma que personne n'exécute ailleurs. Une migration cassée se
voit au premier `npm test`, pas au déploiement.

En production, si la migration échoue, **le conteneur s'arrête** au lieu de
servir l'application. C'est voulu : Next démarre très bien sur une base sans
table, le healthcheck passe, et la panne n'apparaît qu'à la première requête
d'un visiteur.

## Une seule migration par livraison

**Une livraison ne contient qu'UNE nouvelle migration.** Si `migrate dev` en a
produit plusieurs pendant le développement, fusionne-les avant de commiter :

1. concatène les `migration.sql` dans le dossier de la **première** (ordre
   chronologique préservé), séparés par un commentaire `--` ;
2. supprime les dossiers des suivantes ;
3. garde un nom descriptif — `<timestamp>_ajout_du_champ_x`.

Puis remets `_prisma_migrations` en cohérence, sinon Prisma criera au checksum :

```bash
# supprimer les lignes des migrations fusionnées, puis :
npx prisma migrate resolve --applied <migration_fusionnée>
npx prisma migrate status
```

`migrate resolve --applied` recalcule le checksum depuis le dossier et marque la
migration appliquée **sans rejouer le SQL** — le schéma local est déjà à jour.

## Base existante sans historique

Une base qui porte déjà le schéma mais aucune ligne dans `_prisma_migrations`
(cas d'un schéma posé jadis par `db push`) doit être **baseline**, pas migrée :
`migrate deploy` échouerait en voulant recréer une table existante.

```bash
DATABASE_URL="mysql://…" npx prisma migrate resolve --applied 0_init
```

## Garde-fous

- **Ne jamais modifier une migration déjà déployée.** Le checksum changerait et
  Prisma refuserait la base. Une correction se fait par une nouvelle migration.
- **MySQL n'a pas de DDL transactionnel.** Une migration qui échoue à mi-course
  laisse la base à moitié transformée et la marque `failed` : les déploiements
  suivants refuseront de démarrer tant qu'elle n'est pas traitée
  (`migrate resolve --rolled-back <nom>`, réparation du SQL, puis nouvelle
  tentative). Découpe les changements risqués plutôt que de tout empiler dans
  une migration unique.
- **Une modification de `schema.prisma` sans migration** compile, passe les
  tests unitaires et ne casse qu'en production sur un « Unknown column ».
  `src/lib/migrations.test.ts` garde ce cas : il vérifie que chaque champ du
  modèle apparaît dans le SQL versionné, et que la contrainte unique qui borne
  un joueur à un score quotidien n'a pas disparu d'une régénération.
- **La CLI Prisma vit dans l'image de production** (`/opt/prisma`, 252 Mo), à
  l'écart du `node_modules` de la sortie standalone. Ne les fusionne pas : les
  paquets `@prisma/*` de la CLI écraseraient ceux dont l'application a besoin
  pour servir les requêtes.
