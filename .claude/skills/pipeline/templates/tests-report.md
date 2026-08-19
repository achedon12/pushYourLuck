# Rapport de tests — <titre de la tâche>

## Suite du dépôt

```
npm run db:test:setup
npm test > /tmp/pyl-suite.log 2>&1; echo $?
```

| | Résultat |
|---|---|
| `npm run lint` | |
| `npx tsc --noEmit` | |
| unitaires (Vitest) | … / … |
| fonctionnels (Playwright) | … / … |
| visuels (Playwright) | … / … |
| **code de sortie** | |

> Lu depuis le fichier, pas depuis un `| tail` — un pipe renvoie le code de la
> dernière commande et masque l'échec.

## Tests destructifs

| # | Vecteur | Action exacte | Attendu | Observé | Verdict |
|---|---|---|---|---|---|
| 1 | entrée malformée | | | | ✅ / ❌ |
| 2 | API — sans `Origin` | POST `/api/scores` sans en-tête | 403 `forbidden_origin` | | |
| 3 | API — origine étrangère | `Origin: https://evil.example` | 403 | | |
| 4 | API — quota | 25 envois, `x-forwarded-for` changé à chaque fois | le quota mord quand même | | |
| 5 | API — corps géant | `content-length` 2 Mo | 413 | | |
| 6 | anti-triche | suite contenant une action sans effet | rejet du rejeu | | |
| 7 | unicité | deux envois, même `clientId`, même jour | seul le meilleur reste | | |
| 8 | pseudos — faux positifs | « Cassandra », « Connor » | acceptés | | |
| 9 | dates limites | 29 février, passage d'année, 22 h UTC | | | |
| 10 | rendu | 320 / 375 / 430 px, 3 états de thème | aucun débordement | | |

## Cas non couverts, et pourquoi

- <ce que tu n'as pas pu tester, avec la raison — jamais « pas eu le temps »>

## Verdict

**Tous les verdicts sont ✅** : oui / non.
Si non → retour à l'implémentation, puis rejeu de **toute** la suite.
