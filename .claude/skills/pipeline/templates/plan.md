# Plan — <titre de la tâche>

**Type** : fix | feat | refactor | chore | perf
**Branche** : `<type>/<slug>`

## Ce qui est demandé

<reformulation en deux phrases, dans tes mots>

## État constaté

<pour un fix : la reproduction, numérotée, et le comportement observé vs attendu>
<pour une feat : ce qui existe déjà et sur quoi on se greffe>

## Cause racine / point d'ancrage

`<fichier>:<ligne>` — <explication>

## Fichiers touchés

| Fichier | Action | Pourquoi |
|---|---|---|
| `src/…` | modifié | |
| `src/….test.ts` | créé | |

## Tests prévus

| Couche | Fichier | Ce qu'il verrouille |
|---|---|---|
| unitaire / fonctionnel / visuel | | |

> Rappel : une fonctionnalité sans test n'est pas finie. La couche se choisit
> selon la nature du bug, pas selon la commodité.

## Risque de régression

- <feature existante> — <pourquoi elle pourrait casser>

## Retour arrière

<comment annuler si ça casse en production — revert simple ? migration
descendante ? rien de réversible ?>

## Questions ouvertes

- <ce que tu ne peux pas trancher seul ; sinon « aucune »>
