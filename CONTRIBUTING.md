# Contribuer

Merci de l'intérêt porté au projet. Ce document dit comment lancer le projet,
ce qui est attendu d'une contribution, et les quelques règles qui ne se
négocient pas.

## Démarrer

```bash
npm install
npm run db:up          # MySQL 8.4 sur 127.0.0.1:3307
npx prisma generate    # le client Prisma est GÉNÉRÉ, pas installé
npm run db:push
cp .env.example .env
npm run dev            # http://localhost:3001
```

Pour les tests fonctionnels et visuels, une fois :

```bash
npm run db:test:setup
npx playwright install chromium
```

## Avant d'ouvrir une pull request

```bash
npm run lint
npx tsc --noEmit
npm test
```

Les trois doivent passer. La CI les rejoue, mais elle ne devrait rien
t'apprendre que tu ne saches déjà.

## La règle qui ne se négocie pas

**Toute fonctionnalité arrive avec au moins un test**, dans la couche qui lui
correspond :

| Couche | Où | Pour quoi |
|---|---|---|
| unitaire | `src/**/*.test.ts` | logique pure : moteur, dates, filtres, dictionnaires |
| fonctionnel | `tests/functional/` | parcours réels sur l'application et sa base |
| visuel | `tests/visual/` | régressions de mise en page et de thème |

Le détail — quoi tester, comment éviter un test instable, pourquoi les faux
positifs comptent autant que les vrais positifs — est dans
[`.claude/rules/tests.md`](.claude/rules/tests.md). Lis-le avant d'écrire ton
premier test, il est court.

Les tests visuels ne tournent **pas** en intégration continue : le rendu des
polices varie d'une machine à l'autre, une référence produite ici échouerait
ailleurs. Lance-les en local (`npm run test:visual`) et joins les captures
régénérées à ta PR si ton changement touche l'affichage.

## Équilibrage du jeu

Ne change pas une valeur de `src/games/push-your-luck/cards.ts` ni
`BANK_GROWTH` à l'intuition : lance `npm run sim`, qui fait jouer des milliers
de parties par stratégie. La cible est qu'**aucune profondeur de poussée fixe
ne domine** — les gains moyens de 1 à 5 cartes doivent rester plats à environ
5 % près. Joins le tableau produit à ta PR.

## Style

- **Français** pour la copie utilisateur et les commentaires, anglais pour les
  identifiants.
- Aucune chaîne visible en dur : tout passe par `src/i18n/`. Une clé ajoutée en
  français et oubliée en anglais casse la compilation, c'est voulu.
- Aucun emoji dans l'interface : les icônes viennent de `lucide-react`.
- Les commentaires expliquent le **pourquoi**, jamais le quoi. Un commentaire
  qui paraphrase la ligne qu'il surplombe se supprime.
- Messages de commit en français, format *conventional commits*
  (`feat:`, `fix:`, `chore:`, `docs:`…), avec un corps explicatif quand le
  « pourquoi » n'est pas évident.

## Signaler un problème

- Un bug ou une idée : ouvre une **issue** avec le modèle correspondant.
- Une **faille de sécurité** : surtout pas d'issue publique, voir
  [SECURITY.md](SECURITY.md).
