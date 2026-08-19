# Thèmes et palette

## Trois états à couvrir, toujours

Système, clair forcé, sombre forcé. La cascade de `src/app/globals.css` les
gère.

**Ne définis JAMAIS une couleur uniquement dans un bloc `@media` ou
`[data-theme]`** : sa valeur de base doit vivre sur `:root`. Une couleur qui
n'existe que dans une branche disparaît dans les deux autres, et le défaut
« système » est précisément celui qu'on oublie de tester.

Le script de thème posé en tête de `<body>` évite le clignotement au
chargement, et c'est lui qui impose le `suppressHydrationWarning` sur `<html>`.

## Palette

Les couleurs portent du **sens**, elles ne sont pas décoratives :

| Couleur | Signification |
|---|---|
| or | le pot |
| rouge | le danger |
| violet | une action |
| vert | un outil |

Une nouvelle couleur qui ne rentre dans aucune de ces cases est probablement
une couleur de trop. Palette et animations vivent dans `globals.css`.

## Vérifier

`npm run test:visual` compare des captures de référence **et** vérifie
l'absence de débordement horizontal à 320, 375 et 430 px. Une page cassée
reste parfaitement cliquable : ni l'unitaire ni le fonctionnel ne la verront.

Après un changement de design **voulu** : `npm run test:visual:update`, puis
**regarde les images produites** avant de les valider. Mettre à jour une
référence sans la regarder revient à supprimer le test.
