---
name: pyl-engine-change
description: Use when changing anything under src/games/push-your-luck/ — engine actions, cards, RNG, replay — or the game UI that records actions. Enforces the determinism invariant the daily run, the anti-cheat replay and the balance simulation all depend on.
---

# Toucher au moteur

Le moteur est **pur et déterministe**. Trois fonctionnalités tombent ensemble
si on le casse : la partie du jour commune, le rejeu anti-triche, la simulation
d'équilibrage. Ce n'est pas une préférence de style, c'est le contrat du
produit.

## Interdits absolus

Dans `src/games/push-your-luck/` :

- `Math.random()` — tout l'aléatoire passe par `rng.ts`, dont l'état vit dans
  `RunState` ;
- `Date.now()` / `new Date()` — le temps entre par paramètre si besoin ;
- tout import React, DOM, ou de `src/components/` ;
- tout accès réseau ou base.

`cards.ts` ne stocke qu'une **clé** d'icône, jamais un composant : le module est
importé par le moteur, qui tourne aussi côté serveur.

## Le corollaire qu'on oublie

**Une action illégale ne renvoie pas d'erreur : elle renvoie l'état inchangé.**
Le rejeu s'appuie dessus pour refuser toute suite contenant un coup sans effet.

Donc, côté interface : **n'enregistre jamais une action qui n'a rien changé**
(`commit` dans `PushYourLuck.tsx`). Une action inerte ajoutée à la suite rend la
partie irrecevable par le serveur, et le joueur perd son score sans comprendre.

Si tu ajoutes une action au moteur, vérifie les deux côtés :
1. le moteur la refuse-t-il en renvoyant l'état identique ?
2. l'UI s'abstient-elle de l'enregistrer dans ce cas ?

## Procédure

1. Modifie le moteur, avec son test à côté (`engine.test.ts`, `rng.test.ts`,
   `replay.test.ts` — un fichier par module).
2. `npm run test:unit` — doit rester sous la seconde, sans base ni navigateur.
3. **Si les valeurs de jeu bougent** (cartes, `BANK_GROWTH`) : `npm run sim`, et
   reporte la table avant/après dans le commit. Voir `.claude/rules/04-balance.md`.
4. `npm run test:functional` — c'est la couche qui attrape les ruptures de
   couture entre moteur, UI et rejeu.
5. Si le rejeu change de sémantique, vérifie que les scores **déjà en base**
   restent explicables : ils ont été validés par l'ancienne règle.

## Ce que les tests doivent couvrir

Les invariants, pas la forme de l'implémentation :

- « encaisser retire définitivement les cartes tirées » ;
- « le moteur renvoie l'état INCHANGÉ sur une action illégale » ;
- une graine donnée produit toujours la même partie.

Un test qui casse au premier renommage de variable interne n'a rien protégé.
