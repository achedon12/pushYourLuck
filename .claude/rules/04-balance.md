# Équilibrage — par simulation, jamais à l'intuition

Ne change pas une valeur de `cards.ts` ou `BANK_GROWTH` au jugé : lance
`npm run sim`, qui joue des milliers de parties sans navigateur.

**La cible : aucune profondeur de poussée fixe ne doit dominer.** Les gains
moyens à 1, 2, 3, 4 et 5 cartes tirées doivent rester plats à ~5 % près.

- prime d'enchaînement trop forte → « pousser toujours » devient la stratégie
  gagnante, le choix disparaît ;
- prime trop faible → « encaisser immédiatement » gagne, le jeu n'a plus de
  tension.

Les deux tuent le jeu de la même façon : en supprimant la décision.

`npm run sim` mesure une **dérive**, pas une régression : il n'échoue pas, il
rapporte. C'est à toi de lire la table et de juger. Un changement de carte se
livre avec le tableau avant/après dans le message de commit.
