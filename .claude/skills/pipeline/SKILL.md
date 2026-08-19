---
name: pipeline
description: Pipeline complet de développement intransigeant déclenché par `/pipeline <description de tâche>` (ex. `/pipeline ajoute un mode chrono`, `/pipeline fix le classement qui affiche deux fois le même joueur`). Enchaîne analyse → implémentation → tests destructifs → PR GitHub → review automatique → boucle de correction. Aucune sortie sans les trois couches de tests vertes et une review VALIDÉ. Usage exclusif quand l'utilisateur invoque `/pipeline`.
---

# `/pipeline` — pipeline de développement intransigeant

Prend la description libre d'une tâche et exécute un cycle complet de
livraison. Ne se termine que quand le code est mergeable et qu'une review
automatique a rendu **VALIDÉ**.

## Règles transversales

- **Français** partout : commentaires, messages de commit, titre et corps de
  PR, rapports. Anglais pour les identifiants.
- **Conventional commits FR** : `feat:`, `fix:`, `refactor:`, `chore:`,
  `docs:`, `test:`, `perf:`. Sujet à l'impératif présent.
- **Aucune validation sans preuve.** Un test passe si tu l'as exécuté et
  observé. Jamais « ça devrait marcher ».
- **Pas de raccourci destructeur** : jamais `--no-verify`, `--force`,
  `prisma migrate reset`, `git reset --hard`, `prisma db push`, ni
  désactivation de lint.
- **Blocage technique réel** → pose une question précise. N'invente jamais une
  API, une signature, une variable d'environnement.
- **Contexte projet** : Next.js 16 + TypeScript + Tailwind v4, port **3001**.
  Prisma 7 → MySQL 8.4 (dev sur 3307). Client Prisma **généré** sous
  `src/generated/prisma`. Base de test `pushyourluck_test`. Voir `CLAUDE.md` et
  `.claude/rules/`.
- **Skills métier à composer** quand la tâche colle : `pyl-engine-change`,
  `pyl-api-route`, `pyl-i18n-copy`, `pyl-prisma-migration`, `pyl-balance`,
  `pyl-deploy`. Suis leur procédure plutôt que de réinventer.

## Étape 0 — Préparation

1. Identifier le **type** : `fix` | `feat` | `refactor` | `chore` | `perf`.
2. `git status` && `git branch --show-current`. Si on est sur `main`, créer
   `git checkout -b <type>/<slug-court>`.
3. Base de dev up (`npm run db:up`), client généré (`npx prisma generate`),
   migrations à jour (`npx prisma migrate status`).
4. Annoncer le type identifié et le plan macro — une phrase par étape.

## Étape 1 — Analyse et reproduction

**Livrable obligatoire avant la première modification** : un plan écrit,
confronté au code réel. Utilise `templates/plan.md`, et **affiche-le**.

### Pour un `fix`

1. **Reproduire d'abord**, par un test qui échoue. C'est la règle du dépôt :
   « quand tu corriges une régression, ajoute d'abord le test qui la
   reproduit ». Choisis la couche selon la nature du bug (voir
   `.claude/rules/06-tests.md`).
2. Localiser la cause racine à `fichier:ligne`, pas « quelque part dans le
   classement ».
3. **Avant de conclure à un bug de partie, rejoue le test** : une bombe sort au
   premier tirage une fois sur cinq, et l'aléa fait échouer les tests
   fonctionnels au hasard.
4. Interdit d'écrire la moindre ligne de correction tant que le test rouge
   n'existe pas.

### Pour une `feat`

1. Cartographier les points d'intégration : moteur, routes API, vues, les
   **deux** dictionnaires, `routes.ts`, schéma Prisma, cron.
2. Chercher les dépendances inverses (`Grep` sur ce que tu vas toucher).
3. Lister les risques au regard de `.claude/rules/10-gotchas.md`.
4. Si ça traverse base + serveur + client, planifier l'ordre :
   migration → moteur/serveur → API → vues → copie.

### Pour un `refactor`

1. Cartographier tous les consommateurs.
2. Nommer l'invariant à préserver — en premier lieu **le déterminisme du
   moteur** si tu approches `src/games/`.
3. Découper en étapes atomiques, chacune laissant le projet bootable.

### Le plan répond explicitement à

- quels fichiers créés / modifiés / supprimés ;
- **quel test, dans quelle couche**, couvrira le changement ;
- quel risque de régression, sur quoi ;
- quel retour arrière est possible.

## Étape 2 — Implémentation

- **TypeScript strict** : aucun `any`, aucun cast pour faire taire le typage.
  `en.ts` typé d'après `fr.ts` est le filet du projet — ne le contourne pas.
- **Prisma** : passe par `prisma` de `src/lib/prisma.ts`. Jamais de
  `new PrismaClient()` au niveau module : le build Docker tourne sans base.
- **Routes API** : ordre des gardes imposé (origine → quota → taille → corps),
  codes d'erreur et non phrases, traduits dans les deux dictionnaires. Voir
  `pyl-api-route`.
- **Moteur** : aucune impureté. Voir `pyl-engine-change`.
- **Commentaires** : le pourquoi, jamais le quoi (`.claude/rules/11-comments.md`).
  Un commentaire qui paraphrase le code se supprime.
- **Aucun déchet** : pas de `console.log` oublié, pas de TODO orphelin, pas de
  code mort, pas d'import inutile.
- `Edit` sur l'existant, `Write` seulement pour du neuf.

### Porte de sortie de l'étape 2

```bash
npm run lint          # exit 0
npx tsc --noEmit      # exit 0
```

## Étape 3 — Tests

Deux volets. Le premier n'est pas négociable, le second est là pour casser ton
propre code.

### Volet A — la règle du dépôt

**Toute fonctionnalité livrée arrive avec au moins un test, dans la couche qui
lui correspond.** Une fonctionnalité sans test n'est pas finie, même si le code
est juste.

```bash
npm run db:test:setup            # repose la base et rejoue les migrations
npm test > /tmp/pyl-suite.log 2>&1; echo $?
```

⚠️ **Lis le code de sortie depuis un fichier** : `npm test | tail` renvoie
celui de `tail` et masque un échec.

Choix de la couche — elle n'est pas affaire de goût :

| Couche | Pour |
|---|---|
| unitaire, à côté du code | logique pure : moteur, rejeu, dates, filtre, dictionnaires |
| fonctionnel `tests/functional/` | parcours réels sur serveur de prod + vraie base — attrape les bugs de **couture** |
| visuel `tests/visual/` | débordements, thèmes, mise en page — invisible aux deux autres |

### Volet B — tests destructifs

Consigne dans `templates/tests-report.md`. Chaque ligne : action exacte,
attente, observation, verdict.

**Vecteurs obligatoires selon le scope :**

- **Entrées malformées** — champs manquants, types inattendus (`"42"` pour
  `42`, objet pour chaîne), corps géant, JSON tronqué, emojis, unicode RTL,
  octets nuls.
- **API** — appel sans `Origin` (attendu 403), avec une origine étrangère
  (403), `x-forwarded-for` forgé et changé à chaque envoi (le quota doit
  **quand même** mordre), corps de 2 Mo (413), score annoncé énorme avec des
  actions bidon (422).
- **Anti-triche** — suite d'actions contenant un coup sans effet : le rejeu
  doit refuser. Partie fabriquée pour une autre graine que celle du jour.
- **Unicité** — deux envois du même `clientId` le même jour : seul le meilleur
  score reste.
- **Pseudos** — le filtre doit refuser les insultes **et laisser passer**
  « Cassandra », « Connor », « xX_Dragon_Xx ». Un filtre trop zélé fait plus de
  dégâts que ce qu'il empêche.
- **Dates** — 29 février, mois commençant un dimanche, passage d'année,
  minuit à Paris quand il est 22 h UTC.
- **Rendu** — 320, 375 et 430 px ; thème système, clair forcé, sombre forcé.
- **Base injoignable** — un composant serveur qui lit Prisma doit dégrader
  proprement : le build Docker tourne sans base.

### Règle absolue

**Un seul test rouge ou un seul comportement non documenté → retour à l'étape
2.** Puis rejoue **toute** la suite, pas seulement le cas qui a échoué.

Et jamais l'inverse : « un test qui échoue se corrige du côté du code.
Affaiblir l'assertion ou supprimer le cas, c'est effacer l'information au lieu
du bug. » Seule exception : l'assertion elle-même était fausse — alors
corrige-la **et dis pourquoi en commentaire**.

Pour le visuel, `npm run test:visual:update` puis **regarde les images
produites**. Valider une référence sans la regarder revient à supprimer le test.

## Étape 4 — Pull request

1. `git status` — seuls les fichiers du plan.
2. `git diff` — relis tout. Secrets en dur, `console.log`, formatage cassé.
3. `git add <fichiers explicites>` — **jamais** `git add .` ni `-A`.
4. `git commit` en conventional commits FR, corps expliquant le **pourquoi**.
5. `git push -u origin <branche>`.
6. `gh pr create` avec `templates/pr-body.md` rempli. Titre < 70 caractères.

**Ne merge pas.** Affiche l'URL.

## Étape 5 — Review automatique

Lance les reviewers spécialisés du dépôt quand le scope les concerne :

- `Agent(subagent_type: "pyl-determinism-reviewer")` — dès que tu touches
  `src/games/`, `replay`, `simulate` ou le composant qui enregistre les
  actions ;
- `Agent(subagent_type: "pyl-i18n-reviewer")` — dès que tu touches
  `src/components/`, `src/views/`, `src/app/` ou `src/i18n/`.

Puis une review générale via `Agent(subagent_type: "general-purpose")`, avec un
prompt **autonome** — l'agent n'a pas ton contexte. Donne-lui : le dépôt
(`achedon12/pushYourLuck`), la branche, la liste
`git diff --name-only main...HEAD`, le renvoi vers `CLAUDE.md` et
`.claude/rules/`, et le format de `templates/review-report.md`.

Exige : localisation `fichier:ligne`, niveau 🔴 CRITIQUE / 🟠 MAJEUR /
🟡 MINEUR, et un verdict **VALIDÉ** (aucun 🔴 ni 🟠) ou **REJETÉ**.

Pendant qu'il tourne, ne pré-corrige rien. Attache le rapport à la PR :

```bash
gh pr comment <numéro> --body "$(cat /tmp/pyl-review.md)"
```

## Étape 6 — Boucle de correction

1. Reprends chaque 🔴 et 🟠.
2. Correction ciblée → étape 2.
3. `npm run lint`, `npx tsc --noEmit`, **toute** la suite rejouée.
4. Commit `fix(review): <résumé>`.
5. Nouvelle review. Boucle jusqu'à **VALIDÉ**. Aucune limite d'itérations.

### Conclusion

Affiche l'URL de la PR, le nombre de commits et d'itérations de review, les
fichiers touchés, et le rapport final. **Ne merge jamais** — décision humaine.

## Anti-patterns

- ❌ « J'ai testé mentalement » → exécute et observe.
- ❌ « Le test échoue mais c'est un cas limite » → c'est précisément ce qu'on teste.
- ❌ « Je supprime ce test qui ne passe pas » → tu corriges le code.
- ❌ « J'affaiblis l'assertion pour repasser au vert » → tu effaces l'information.
- ❌ « Je valide les captures visuelles sans les ouvrir » → tu supprimes le test.
- ❌ « Je livre la fonctionnalité, le test viendra après » → elle n'est pas finie.
- ❌ « `npm test | tail` affiche 0, c'est bon » → c'est le code de `tail`.
- ❌ « Je merge moi-même » → jamais.
