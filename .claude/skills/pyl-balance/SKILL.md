---
name: pyl-balance
description: Use when tuning game balance — card values, bomb count, BANK_GROWTH, shop offers — or when the user says a strategy feels dominant. Drives the simulation loop instead of guessing.
---

# Équilibrer

**Ne change jamais une valeur à l'intuition.** `npm run sim` joue des milliers
de parties sans navigateur et sort la table qui tranche.

## La cible

**Aucune profondeur de poussée fixe ne doit dominer.** Les gains moyens à 1, 2,
3, 4 et 5 cartes tirées restent plats à ~5 % près.

- prime d'enchaînement trop forte → « pousser toujours » gagne ;
- trop faible → « encaisser immédiatement » gagne.

Les deux suppriment la décision, donc le jeu.

## Procédure

1. `npm run sim` **avant** de toucher quoi que ce soit — c'est ta référence.
2. Un seul levier à la fois (`cards.ts` OU `BANK_GROWTH`, pas les deux).
3. `npm run sim` à nouveau, compare les profils.
4. Recommence jusqu'à la platitude visée.
5. Commit avec la table avant/après dans le corps du message.

## Pièges

- `npm run sim` **ne échoue jamais** : il rapporte. Personne ne t'arrêtera si
  tu livres un déséquilibre — c'est à toi de lire.
- Le simulateur dépend du déterminisme du moteur. Si tu as touché à `rng.ts`,
  les chiffres ne sont plus comparables aux précédents : refais une référence.
- Une carte n'est pas qu'un nombre : vérifie aussi qu'elle reste lisible à
  l'écran (`npm run test:visual`) et nommée dans les deux langues.
