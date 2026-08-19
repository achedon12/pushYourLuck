# Rapport de review — PR #<numéro>

**Branche** : `<branche>`
**Fichiers examinés** : <nombre>

## Verdict

**VALIDÉ** | **REJETÉ**

> REJETÉ dès qu'il reste un 🔴 ou un 🟠. Les 🟡 sont signalés sans bloquer.

## Points bloquants

### 🔴 CRITIQUE

- **`<fichier>:<ligne>`** — <problème>
  **Conséquence** : <ce que ça produit en production>
  **Correction suggérée** : <piste>

### 🟠 MAJEUR

- **`<fichier>:<ligne>`** — <problème>
  **Conséquence** :
  **Correction suggérée** :

## Points mineurs

### 🟡 MINEUR

- **`<fichier>:<ligne>`** — <remarque>

## Invariants du dépôt vérifiés

| Invariant | État |
|---|---|
| moteur pur et déterministe (pas de `Math.random`, `Date.now`, React) | |
| aucune action sans effet enregistrée par l'UI | |
| une fonctionnalité = un test, dans la bonne couche | |
| aucune chaîne visible en dur, deux dictionnaires synchrones | |
| URL internes via `path(key, locale)` | |
| gardes de route dans l'ordre (origine → quota → taille → corps) | |
| codes d'erreur traduits, pas de phrase en dur | |
| changement de schéma accompagné d'une migration | |
| commentaires expliquant le pourquoi, aucun paraphrasant le code | |

## Ce qui a été bien fait

- <à mentionner, sans complaisance>
