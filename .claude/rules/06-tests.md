# Tests — trois couches, une fonctionnalité = un test

**Règle absolue de ce dépôt : toute fonctionnalité livrée arrive avec au moins
un test, dans la couche qui lui correspond.** Pas « quand j'aurai le temps »,
pas « c'est trivial ». Une fonctionnalité sans test n'est pas finie, même si le
code est juste.

`npm test` doit passer avant de déclarer quoi que ce soit terminé, au même titre
que `npm run lint` et `npm run build`.

## Les trois couches, et ce que chacune attrape

Elles ne se remplacent pas : chacune voit une classe de bugs que les deux autres
laissent passer. Le choix de la couche n'est pas une question de goût.

### 1. Unitaire — `src/**/*.test.ts` (Vitest, `npm run test:unit`)

Pour toute **logique pure** : moteur de jeu, aléatoire déterministe, rejeu,
filtre de pseudos, dates, dictionnaires, échappement SQL. Rapide (moins d'une
seconde), sans navigateur, sans base.

Le test vit **à côté** du code qu'il couvre : `nameFilter.ts` →
`nameFilter.test.ts`. Un module sans voisin `.test.ts` se voit d'un coup d'œil.

La base de données ne doit **jamais** être touchée à ce niveau : simule le
module Prisma (`vi.mock('@/lib/prisma', …)`).

### 2. Fonctionnel — `tests/functional/*.spec.ts` (Playwright, `npm run test:functional`)

Pour les **parcours** sur l'application réelle : serveur Next construit en
production, vraie base MySQL. Jouer une manche, encaisser, envoyer un score,
changer de langue, naviguer dans le calendrier, lire les balises servies.

C'est la couche qui trouve les bugs de **couture** — ceux qui n'existent dans
aucun module pris isolément. Exemple vécu : les deux groupes de routes
déclaraient chacun leur image de partage à la racine, elles se neutralisaient,
et les pages anglaises n'avaient aucune balise `og:image`. Aucun test unitaire
ne pouvait le voir ; le fonctionnel l'a sorti en une assertion.

### 3. Visuel — `tests/visual/*.spec.ts` (Playwright, `npm run test:visual`)

Pour ce que ni l'unitaire ni le fonctionnel ne voient : une marge qui saute, un
thème qui déraille, une mise en page qui déborde. Une page cassée reste
parfaitement cliquable — le fonctionnel n'y verra rien.

Deux formes :

- **captures de référence** comparées au pixel près ;
- **assertions de débordement** (`scrollWidth <= clientWidth`) à 320, 375 et
  430 px, qui n'exigent aucune image et ne deviennent jamais caduques.

Après un changement de design **voulu** : `npm run test:visual:update`, puis
regarde les images produites avant de les valider. Mettre à jour une référence
sans la regarder revient à supprimer le test.

## Base de test

Les couches 2 et 3 tournent sur `pushyourluck_test`, **jamais** sur la base de
développement. Les fixtures sont réinstallées par `scripts/seed-test-db.ts`, qui
refuse de s'exécuter si l'URL ne contient pas `_test` — ce script efface tout.

Le client Prisma généré est un module ESM et Playwright charge sa configuration
en CommonJS : ni `playwright.config.ts` ni `tests/fixtures.ts` ne doivent
importer Prisma. Les tests interrogent l'application **par son API**, ce qui est
de toute façon la bonne façon d'éprouver un parcours.

## Quoi tester

Le **pourquoi** de la fonctionnalité, jamais la forme de son implémentation. Un
test qui casse au premier renommage de variable interne n'a rien protégé.

- **Les invariants** qui font tenir le produit : « encaisser retire
  définitivement les cartes tirées », « le moteur renvoie l'état INCHANGÉ sur une
  action illégale ». Le rejeu anti-triche repose entièrement sur le second.
- **Les cas limites datés** : février bissextile, mois commençant un dimanche,
  passage d'année, minuit à Paris quand il est 22 h UTC.
- **Les décisions non évidentes**, avec leur raison en commentaire : pourquoi le
  titre d'accueil est absolu, pourquoi les scores partent en paliers, pourquoi la
  barre oblique inverse s'échappe avant l'apostrophe.
- **Le sens interdit.** Un filtre ne se teste pas qu'avec ce qu'il doit bloquer :
  `nameFilter.test.ts` vérifie que « Cassandra », « Connor » et « xX_Dragon_Xx »
  passent. Un filtre trop zélé fait plus de dégâts que ce qu'il empêche. Cette
  moitié-là n'est jamais optionnelle.

## Rendre une fonctionnalité testable

Si la logique est enfouie dans un composant React, **sors-la** dans une fonction
pure plutôt que de monter un DOM pour l'atteindre : c'est ce qui a été fait pour
la grille du calendrier (`lib/calendar.ts`) et les bornes de navigation
(`lib/months.ts`).

Pour le visuel, la page doit être **déterministe** : données figées par les
fixtures, et zones dépendant de la date explicitement masquées via un
`data-testid` (`daily-date`, `leaderboard-date`, `calendar`). On masque plutôt
qu'on n'exclut, pour que la PLACE de l'élément reste comparée.

## Le hasard, piège numéro un des tests fonctionnels

Le paquet du mode libre est aléatoire. Une bombe sort au premier tirage environ
une fois sur cinq : un test qui affirme « après un tirage il reste 25 cartes »
échoue un jour sur cinq **sans qu'aucun bug n'existe**, et un test qui échoue au
hasard finit par être ignoré.

Accepte les deux issues, ou passe par une aide qui converge (`drawUntilBankable`
relance une partie si les trois vies y passent). Ne fige jamais une suite de
tirages en espérant qu'elle tombe bien.

## Hygiène

- Les noms de tests sont en **français** et décrivent un comportement
  observable : « refuse une partie forgée », pas « test replay 2 ».
- Un test qui échoue se corrige **du côté du code**. Affaiblir l'assertion ou
  supprimer le cas pour repasser au vert, c'est effacer l'information au lieu du
  bug. Seule exception : quand l'assertion elle-même était fausse — alors
  corrige-la et dis pourquoi en commentaire.
- Quand tu corriges une régression, ajoute d'abord le test qui la reproduit. Les
  bugs déjà rencontrés ici — actions sans effet enregistrées dans la suite du
  rejeu, marque dupliquée dans le titre, faux positif du filtre de pseudos,
  image de partage anglaise absente — ont tous leur assertion aujourd'hui.
