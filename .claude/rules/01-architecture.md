# Architecture — et l'invariant à ne jamais casser

## Où vit quoi

- **`src/games/push-your-luck/`** — le moteur. `engine.ts` (état et actions),
  `cards.ts` (catalogue en données), `rng.ts` (aléatoire déterministe),
  `replay.ts` (rejeu d'une partie). Aucun DOM, aucun React.
- **`src/components/game/`** — l'interface, seule à connaître React.
- **`src/views/`** — une vue par page, partagée par les deux langues. Les
  fichiers de `src/app/(fr)/` et `src/app/(en)/` ne font que les appeler avec
  leur langue.
- **`src/i18n/`** — dictionnaires, table des URL traduites, aides de formatage.
- **`src/lib/`** — utilitaires transverses : accès Prisma, dates, filtre de
  pseudos, limitation de débit, garde d'origine.
- **`src/app/api/`** — routes REST. Voir `08-api-security.md`.
- **`src/content/changelog.ts`** — notes de version, bilingues dans la même
  entrée.
- **`scripts/`** — outils hors application (simulation, sauvegarde, semis,
  export des logos), lancés par `tsx`.

## L'invariant à ne jamais casser

**Le moteur est pur et déterministe.** Pas de React, pas de `Date.now()`, pas
de `Math.random()` : tout l'aléatoire passe par `rng.ts`, dont l'état vit dans
`RunState`. Trois fonctionnalités en dépendent directement, et tombent
ensemble si on le casse :

- la partie du jour identique pour tous les joueurs ;
- la validation anti-triche, qui **rejoue** la partie côté serveur au lieu de
  croire le score annoncé (`replay.ts`, `api/scores`) ;
- l'équilibrage par simulation de masse (`scripts/simulate.ts`).

**Corollaire, et c'est le piège** : le moteur ne renvoie jamais d'erreur sur
une action illégale, il renvoie l'état **inchangé**. Le rejeu s'appuie
là-dessus pour refuser toute suite d'actions contenant un coup sans effet —
donc **l'UI ne doit jamais enregistrer une action qui n'a rien changé**
(`commit` dans `PushYourLuck.tsx`). Une action inerte ajoutée à la suite rend
la partie irrecevable côté serveur, et le joueur perd son score sans
comprendre pourquoi.

## Rendu et hydratation

Deux groupes de routes racine (`app/(fr)` et `app/(en)`), donc **deux layouts
racine**. C'est le seul moyen de faire varier `<html lang>` en gardant les URL
françaises sans préfixe ni redirection. Conséquence documentée par Next :
passer d'une langue à l'autre recharge la page entièrement.

`RootShell` est le corps commun aux deux. Le `suppressHydrationWarning` sur
`<html>` y est indispensable **et seulement là** : le script de thème pose
`data-theme` avant l'hydratation, donc l'attribut diffère forcément du HTML
rendu par le serveur.
