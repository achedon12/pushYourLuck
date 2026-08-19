# Push Your Luck

Jeu de cartes « pousse ta chance » jouable dans le navigateur, sur
**pushyourluck.net**. Une partie du jour identique pour tous, un
classement quotidien, aucune inscription.

## Le jeu en deux règles

1. Chaque carte tirée gonfle le pot ; cinq bombes sont dans le paquet. Une bombe
   fait perdre le pot et une vie (trois vies par partie).
2. **Encaisser retire définitivement du paquet les cartes tirées.** Comme une
   manche encaissée ne contient jamais de bombe, ce sont toujours de bonnes
   cartes qui partent : le paquet devient plus dangereux à chaque encaissement.

Une prime d'enchaînement de +22 % par carte tirée (cumulative) récompense les
manches longues. La valeur `BANK_GROWTH` a été calibrée par simulation : voir
`scripts/simulate.ts`.

## Démarrer

```bash
npm run db:up        # MySQL 8.4 sur le port 3307 (données dans ./mysql-data-dev)
npx prisma generate  # prérequis : le client Prisma est généré, pas installé
npm run db:push      # crée la table Score
npm run dev          # http://localhost:3001

# Une seule fois, pour pouvoir lancer les tests fonctionnels et visuels :
npm run db:test:setup
npx playwright install chromium
```

## Langues, thèmes et identité

- **Deux langues** : français sur des URL sans préfixe (`/regles`), anglais
  préfixé (`/en/rules`). Les slugs sont traduits. Toute la copie vit dans
  `src/i18n/fr.ts` et `src/i18n/en.ts` ; l'anglais est typé d'après le français,
  donc une clé oubliée casse le build.
- **Deux thèmes** clair et sombre, avec suivi du réglage système et bascule
  manuelle persistée. Les tokens sont dans `src/app/globals.css`.
- **Logos** : les SVG de `public/` sont la source (`logo.svg`, `logo-mark.svg`
  et leurs variantes claires/monochromes). `npm run logos` en exporte les PNG et
  reconstruit `src/app/favicon.ico`. Ne retouche jamais un PNG à la main.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement sur le port 3001 |
| `npm run build` / `npm start` | build et serveur de production (port 3001) |
| `npm run sim` | simulation d'équilibrage headless (milliers de parties) |
| `npm run smoke` | test bout en bout de la soumission de score sur un serveur local |
| `npm run logos` | réexporte les PNG et le favicon depuis les SVG de `public/` |
| `npm test` | les trois couches — obligatoire avant toute livraison |
| `npm run test:unit` | tests unitaires (Vitest), sans navigateur ni base |
| `npm run test:functional` | parcours réels (Playwright + base de test) |
| `npm run test:visual` | captures de référence et débordements mobiles |
| `npm run test:visual:update` | régénère les captures après un changement voulu |
| `npm run db:test:setup` | crée la base `pushyourluck_test` et y applique le schéma |
| `npm run backup` | sauvegarde manuelle de la base dans `dump/` |
| `npm run seed:history` | remplit la base de DEV d'un historique fictif (calendrier) |
| `npm run db:up` / `db:down` | base de développement |
| `npm run db:push` / `db:studio` | schéma et exploration |

## Architecture

- **`src/games/push-your-luck/`** — moteur pur, sans DOM ni React. `engine.ts`
  (état et actions), `cards.ts` (catalogue de cartes en données), `rng.ts`
  (aléatoire déterministe), `replay.ts` (rejeu d'une partie).
- **`src/components/game/`** — l'interface, seule à connaître React.
- **`src/i18n/`** — dictionnaires, table des URL traduites, aides de formatage.
- **`src/views/`** — une vue par page, partagée par les deux langues ; les
  fichiers de `src/app/(fr)/` et `src/app/(en)/` ne font que les appeler avec
  leur langue. Deux layouts racine (un par groupe) donnent le bon
  `<html lang>` sans préfixer le français ni rediriger.
- **`src/content/changelog.ts`** — notes de version, bilingues dans la même entrée.
- **`src/app/api/scores/`** — classement. **Le score n'est jamais lu depuis la
  requête** : le serveur rejoue la suite d'actions envoyée par le client depuis
  la graine du jour et recalcule le résultat lui-même.

Le déterminisme du moteur est la clef de voûte : il donne la partie du jour
commune, la validation anti-triche par rejeu, et l'équilibrage par simulation.

## Exploitation

- **Mesure d'audience** : Matomo auto-hébergé, chargé uniquement si
  `NEXT_PUBLIC_MATOMO_URL` et `NEXT_PUBLIC_MATOMO_SITE_ID` sont renseignés, et
  configuré **sans cookie** (`disableCookies`). C'est cette configuration qui
  dispense de bandeau de consentement — à condition que l'instance Matomo
  anonymise bien les adresses IP de son côté.
- **Sauvegardes** : le processus Next lance un cron (`src/instrumentation.ts` →
  `src/server/cron.ts`) qui, chaque nuit à 03h15 heure de Paris, écrit un dump
  SQL compressé dans `dump/` et supprime les scores de plus d'un an — la durée
  annoncée dans la politique de confidentialité. Les sept dernières sauvegardes
  sont conservées. Le cron est **désactivé hors production**.
- **Restauration** :
  `gunzip -c dump/pushyourluck-….sql.gz | docker exec -i pyl_db mysql -upushyourluck -p pushyourluck`
- **Pseudos** : `src/lib/nameFilter.ts` refuse côté serveur les insultes, les
  usurpations (`admin`, `staff`…) et leurs contournements courants (chiffres à
  la place des lettres, lettres espacées, répétitions). `npm run names` vérifie
  autant les refus que les **faux positifs** — un filtre qui bloque « Cassandra »
  fait plus de dégâts qu'un gros mot.
- **Une instance à la fois** : le cron tourne dans le processus applicatif. Le
  jour où l'app passera en plusieurs instances, il faudra un verrou partagé.

## Isolation vis-à-vis du loup-garou

Les deux projets cohabitent sur la même machine sans se marcher dessus :
projet Docker `pushyourluck`, réseau `pyl_network`, conteneurs `pyl_*`,
MySQL sur **3307** (le loup-garou utilise Postgres 5433 et Redis 6379).

⚠️ **Un seul conflit possible, en production** : le `docker-compose.yml` du
loup-garou mappe déjà l'hôte **3001** (`werewolf_node_blue`). Si les deux stacks
de production tournent sur la même machine, poser `PYL_HOST_PORT=3005` dans le
`.env` du serveur.

## Déploiement

```bash
MYSQL_PASSWORD=… MYSQL_ROOT_PASSWORD=… docker compose -p pushyourluck up -d --build
```

Les deux mots de passe sont **obligatoires** : le dépôt est public, aucune
valeur de repli n'y figure et la stack refuse de démarrer sans eux. Données
MySQL dans `./mysql-data`, sauvegardes dans `./dump` (bind mounts à la racine).

### Activer la mesure d'audience en production

Les variables `NEXT_PUBLIC_*` sont **inlinées dans le bundle du navigateur au
moment de la construction** : les passer au démarrage du conteneur n'a aucun
effet. Elles doivent être présentes dans le `.env` du serveur **avant** le
`docker compose build`, qui les transmet en arguments de construction :

```bash
# .env du serveur
NEXT_PUBLIC_SITE_URL=https://pushyourluck.net
NEXT_PUBLIC_MATOMO_URL=https://matomo.leoderoin.fr
NEXT_PUBLIC_MATOMO_SITE_ID=7
```

```bash
docker compose -p pushyourluck up -d --build   # --build est indispensable
```

Trois garde-fous :

- **le `.env` n'entre jamais dans l'image** (exclu du contexte) — Next le
  recopie sinon tel quel dans la sortie `standalone` ;
- **la mesure est coupée hors production**, même variables renseignées, pour
  qu'un `npm run dev` ne compte pas de visites dans les chiffres réels ;
- **la CSP ajoute l'hôte Matomo automatiquement** à partir de la même variable :
  changer d'instance ne demande aucune modification de code.

Vérifier après déploiement : `curl -sI https://pushyourluck.net | grep -i
content-security-policy` doit mentionner ton instance, et une visite doit
apparaître dans Matomo en temps réel.

### L'image de production

**237 Mo**, contre 322 Mo pour un `Dockerfile` naïf. Trois décisions :

| Levier | Gain |
|---|---|
| `alpine` nue + binaire Node recopié, au lieu de `node:26-alpine` | −59 Mo |
| Binaire Node débarrassé de ses symboles de débogage | −20 Mo |
| `sharp` et `@img` exclus du traçage (aucun `next/image` dans le projet) | −19 Mo |

Ce qui reste est incompressible : le binaire Node pèse 128 Mo à lui seul, ICU
complet inclus — indispensable au formatage des dates en français.

**Servir le build depuis nginx n'est pas possible** : l'application a besoin de
Node à la requête pour l'API de scores (validation anti-triche par rejeu), pour
le classement rendu à la demande, et pour le cron de sauvegarde. Nginx a sa
place *devant* — TLS, cache des fichiers statiques, limitation de débit — mais
pas *à la place*.

## Contribuer

Les contributions sont bienvenues — lis [CONTRIBUTING.md](CONTRIBUTING.md)
d'abord, en particulier la règle « une fonctionnalité = un test ». Pour une
faille de sécurité, passe par [SECURITY.md](SECURITY.md), jamais par une issue
publique.

## Licence

[MIT](LICENSE). La licence porte sur le code : elle ne concède aucun droit sur
le nom « Push Your Luck » ni sur l'identité visuelle du site.
