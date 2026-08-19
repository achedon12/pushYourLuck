# Conventions

- **Français** pour toute la copie utilisateur et pour les commentaires ;
  **anglais** pour les identifiants.
- **Aucun emoji dans l'interface.** Les icônes viennent de `lucide-react`, via
  `src/components/game/cardIcons.tsx`. `cards.ts` ne stocke qu'une clé
  d'icône : ce module est importé par le moteur, qui tourne aussi côté serveur
  et ne doit rien savoir de React.
- **Les logos se modifient dans les SVG de `public/`**, jamais dans les PNG.
  `npm run logos` régénère les rasterisations et `src/app/favicon.ico`.
- **Nommage des tests en français**, décrivant un comportement observable :
  « refuse une partie forgée », pas « test replay 2 ».
- **Commits** : conventional commits en français, corps explicatif quand le
  « pourquoi » ne tient pas dans le titre.
