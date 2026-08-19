# Exploitation — cron, sauvegardes, image, déploiement

## Tâches planifiées

`src/instrumentation.ts` démarre `initializeCron()` à l'amorçage du serveur ;
il n'y a **pas** de serveur personnalisé comme sur le loup-garou. Le cron est
coupé hors production, sinon chaque `npm run dev` écrirait un dump.

Chaque nuit à 03h15 (Europe/Paris) : un dump SQL compressé dans `dump/`, et la
suppression des scores de plus d'un an. Les sept dernières sauvegardes sont
conservées.

**La purge d'un an n'est pas un nettoyage de confort** : c'est l'engagement
écrit sur la page confidentialité. Si tu changes la durée, change aussi les
deux dictionnaires — sinon le site ment à ses visiteurs.

La sauvegarde passe par Prisma et non par `mysqldump` : l'image applicative est
une alpine sans client MySQL, et le dump doit marcher à l'identique en dev.

**Une instance à la fois.** Le cron tourne dans le processus applicatif. Le
jour où l'app passera en plusieurs instances, il faudra un verrou partagé.

## L'image de production

568 Mo. Les décisions qui la composent, dans l'ordre du `Dockerfile` :

- `alpine` nue + binaire Node recopié et *strippé*, au lieu de `node:26-alpine` ;
- `sharp` et `@img` exclus du traçage — `next/image` n'est jamais utilisé ;
- la CLI Prisma et son moteur de schéma dans `/opt/prisma` (252 Mo), **à
  l'écart** du `node_modules` de la sortie standalone. Ne les fusionne pas :
  les paquets `@prisma/*` de la CLI écraseraient ceux dont l'application a
  besoin pour servir les requêtes.

## Variables et construction

Les `NEXT_PUBLIC_*` sont **inlinées dans le bundle du navigateur à la
construction**. Les passer au démarrage du conteneur n'a **aucun** effet :
elles doivent être dans le `.env` du serveur avant le `docker compose build`,
qui les transmet en arguments de construction.

C'est la panne qui a coûté le plus cher à diagnostiquer : la CSP est servie par
le *runtime* et peut donc mentionner correctement l'hôte Matomo alors que le
bundle, lui, embarque encore l'ancienne valeur. Deux sources, deux moments,
deux vérités. Vérifie toujours **le bundle**, pas seulement l'en-tête.

Le `.env` n'entre jamais dans l'image : Next le recopierait tel quel dans la
sortie standalone.

## Déployer

```bash
# .env du serveur : MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, NEXT_PUBLIC_*
docker compose -p pushyourluck up -d --build   # --build est indispensable
```

Les migrations sont jouées par `docker-entrypoint.sh` avant le démarrage de
Next — voir `07-migrations.md`.
