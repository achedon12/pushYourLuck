---
name: pyl-i18n-copy
description: Use when adding or changing any user-visible text, or adding a page or route. Keeps the two dictionaries and the translated URL table in sync, and prevents hard-coded strings.
---

# Ajouter ou modifier de la copie

Français sur des URL sans préfixe (`/regles`), anglais préfixé (`/en/rules`).
Les slugs sont traduits eux aussi.

## Règles

- **Aucune chaîne visible en dur dans un composant.** Tout passe par
  `src/i18n/`.
- **Les dictionnaires ne contiennent que des chaînes**, jamais de fonctions :
  ils traversent la frontière serveur → client.
- **Toute URL interne passe par `path(key, locale)`** (`src/i18n/routes.ts`) —
  c'est ce qui tient ensemble les `hreflang`, le sitemap et le sélecteur de
  langue.
- **`en.ts` est typé d'après `fr.ts`** : une clé française sans équivalent
  anglais casse la compilation. Ne contourne jamais avec `any`.

## Procédure

1. Ajoute la clé dans `src/i18n/fr.ts`, à sa place logique.
2. `npx tsc --noEmit` — il réclame aussitôt la clé anglaise.
3. Ajoute-la dans `en.ts`.
4. Variable dans la chaîne ? `{nom}` + `format()`. **Jamais** de
   concaténation : l'ordre des mots change d'une langue à l'autre.
5. Pluriel ? `plural()`, pas un ternaire sur `=== 1`.
6. `npm run test:unit`, puis `npm run test:functional`.

## Nouvelle page

1. Entrée dans `routes.ts` pour les **deux** langues.
2. Une vue dans `src/views/`, appelée par `src/app/(fr)/…` et `src/app/(en)/…`.
3. Vérifie les balises servies : `tests/functional/seo.spec.ts` couvre
   canonique, `hreflang` réciproques, sitemap et image de partage **par
   langue** — une image déclarée à la racine des deux groupes se neutralise, et
   les pages anglaises se retrouvent sans `og:image`. C'est arrivé.

## Textes à double engagement

Certaines chaînes décrivent un comportement réel du serveur. Si tu changes
l'un, change l'autre :

- la durée de conservation des scores, annoncée sur la page confidentialité et
  appliquée par le cron de purge ;
- la description de la mesure d'audience, qui doit rester vraie vis-à-vis de la
  configuration Matomo.
