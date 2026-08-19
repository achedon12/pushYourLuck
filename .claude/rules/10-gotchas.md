# Pièges connus

Chacun a déjà coûté du temps sur ce dépôt.

- **Le port 3001 est aussi celui du loup-garou en production.** Si les deux
  stacks cohabitent, poser `PYL_HOST_PORT=3005` dans le `.env` du serveur.
- **Le build Docker tourne sans base joignable** : toute lecture Prisma dans un
  composant serveur doit dégrader proprement. Le client est construit à la
  première utilisation, pas à l'import — ne remets pas de `new PrismaClient()`
  au niveau module.
- **`dayKey` est figé au fuseau Europe/Paris.** Sans ça, le classement
  quotidien n'a aucun sens d'un fuseau à l'autre.
- **Le filtre de pseudos a deux listes distinctes** : `WORDS` cherchée en mot
  entier, `FRAGMENTS` cherchée partout. Ne déplace jamais un terme court de
  l'une à l'autre sans lancer `npx vitest run src/lib/nameFilter.test.ts` :
  « ass » cherché partout bannit « Cassandra ».
- **Le client Prisma généré peut être périmé** après un changement de schéma :
  `npx prisma generate` avant de croire une erreur de typage sur un champ.
- **Le hasard fait échouer les tests fonctionnels au hasard.** Une bombe sort
  au premier tirage environ une fois sur cinq. Un test qui fige une suite de
  tirages échoue un jour sur cinq sans qu'aucun bug n'existe — voir
  `06-tests.md`. Avant de conclure à une régression sur un test de partie,
  rejoue-le.
- **`npm test` en pipeline masque son code de sortie** : `npm test | tail` rend
  celui de `tail`. Redirige dans un fichier et lis `$?`.
