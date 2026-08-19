# CLAUDE.md

Guide pour travailler sur ce dépôt. Voir `README.md` pour le démarrage.

## Fichiers de règles

@.claude/rules/tests.md

## Le projet en un paragraphe

Application Next.js 16 (App Router, TypeScript, Tailwind v4) servant un unique
jeu de cartes solo sur le port **3001**. Prisma 7 → MySQL 8.4, client **généré**
sous `src/generated/prisma` (`npx prisma generate` est un prérequis de `dev` et
`build`). Interface et copie **en français**. Trois couches de tests, toutes obligatoires
(voir la règle ci-dessus) : **unitaire** (Vitest), **fonctionnel** et **visuel**
(Playwright, sur une base dédiée `pushyourluck_test`). `npm test` lance tout.
S'y ajoute `npm run sim`, qui mesure la dérive d'équilibrage plutôt qu'une
régression.

## L'invariant à ne jamais casser

**Le moteur (`src/games/push-your-luck/`) est pur et déterministe.** Pas de
React, pas de `Date.now()`, pas de `Math.random()` : tout l'aléatoire passe par
`rng.ts` dont l'état vit dans `RunState`. Trois fonctionnalités en dépendent
directement, et tombent ensemble si on le casse :

- la partie du jour identique pour tous les joueurs ;
- la validation anti-triche, qui **rejoue** la partie côté serveur au lieu de
  croire le score annoncé (`replay.ts`, `api/scores`) ;
- l'équilibrage par simulation de masse (`scripts/simulate.ts`).

Corollaire : le moteur ne renvoie jamais d'erreur sur une action illégale, il
renvoie l'état **inchangé**. Le rejeu s'appuie là-dessus pour refuser toute
suite d'actions contenant un coup sans effet — donc **l'UI ne doit jamais
enregistrer une action qui n'a rien changé** (`commit` dans `PushYourLuck.tsx`).

## Équilibrage

Ne change pas une valeur de `cards.ts` ou `BANK_GROWTH` à l'intuition : lance
`npm run sim`. La cible est qu'**aucune profondeur de poussée fixe ne domine** —
les gains moyens de 1 à 5 cartes doivent rester plats à ~5 % près. Une prime
trop forte rend « pousser toujours » gagnant, trop faible rend « encaisser
immédiatement » gagnant ; les deux tuent le jeu.

## Internationalisation

Deux langues, deux groupes de routes racine (`app/(fr)` et `app/(en)`), donc
**deux layouts racine**. C'est volontaire : c'est le seul moyen de faire varier
`<html lang>` tout en gardant les URL françaises sans préfixe et sans
redirection. Conséquence documentée par Next : naviguer d'une langue à l'autre
recharge la page entièrement.

Règles à tenir :

- Aucune chaîne visible en dur dans un composant — tout passe par `src/i18n/`.
- Les dictionnaires ne contiennent **que des chaînes**, jamais de fonctions :
  ils traversent la frontière serveur → client. L'interpolation et les pluriels
  se font à l'usage avec `format()` et `plural()`.
- Toute URL interne passe par `path(key, locale)` (`src/i18n/routes.ts`). C'est
  ce qui garantit que les `hreflang`, le sitemap et le sélecteur de langue
  restent cohérents.
- `en.ts` est typé d'après `fr.ts` : ajouter une clé en français et l'oublier en
  anglais casse la compilation. C'est le filet, ne le contourne pas avec `any`.

## Thèmes

Trois états à couvrir : système, clair forcé, sombre forcé. La cascade CSS de
`globals.css` les gère ; ne définis **jamais** une couleur uniquement dans un
bloc `@media` ou `[data-theme]`, sa valeur de base doit vivre sur `:root`.
Le script de thème posé en tête de `<body>` évite le clignotement, et c'est lui
qui impose le `suppressHydrationWarning` sur `<html>`.

## Conventions

- Français pour toute la copie utilisateur et les commentaires ; anglais pour
  les identifiants.
- **Aucun emoji dans l'interface** — les icônes viennent de `lucide-react`, via
  `components/game/cardIcons.tsx`. `cards.ts` ne stocke qu'une clé d'icône :
  ce module est importé par le moteur, qui tourne aussi côté serveur et ne doit
  rien savoir de React.
- Les commentaires expliquent le **pourquoi**, jamais le quoi. Un commentaire
  qui paraphrase le code se supprime.
- Palette et animations dans `globals.css` ; les couleurs portent du sens
  (or = pot, rouge = danger, violet = action, vert = outil).
- Les logos se modifient dans les SVG de `public/`, jamais dans les PNG :
  `npm run logos` régénère les rasterisations et le favicon.

## Tâches planifiées

`src/instrumentation.ts` démarre `initializeCron()` à l'amorçage du serveur —
il n'y a pas de serveur personnalisé comme sur le loup-garou. Le cron est coupé
hors production, sinon chaque `npm run dev` écrirait un dump. La sauvegarde
passe par Prisma et non par `mysqldump` : l'image applicative est une alpine
sans client MySQL, et le dump doit marcher à l'identique en dev.

La purge des scores de plus d'un an n'est pas un nettoyage de confort : c'est
l'engagement écrit sur la page confidentialité. Si tu changes la durée, change
aussi les deux dictionnaires.

## Pièges connus

- **Le port 3001 est aussi celui du loup-garou en production** (voir README).
- Toute lecture Prisma dans un composant serveur doit dégrader proprement : le
  build Docker tourne sans base joignable.
- `dayKey` est figé au fuseau **Europe/Paris**, sinon le classement quotidien
  n'a pas de sens d'un fuseau à l'autre.
- Le filtre de pseudos a deux listes distinctes (`WORDS` recherchée en mot
  entier, `FRAGMENTS` recherchée partout). Ne déplace jamais un terme court de
  l'une à l'autre sans lancer `npm run names` : « ass » cherché partout bannit
  « Cassandra ».
- L'API des scores renvoie des **codes** d'erreur, pas des phrases : le message
  est traduit côté client. N'y remets pas de texte en dur.
- Le client Prisma généré peut être périmé après un changement de schéma :
  `npx prisma generate` avant de croire une erreur de typage sur un champ.
