## Ce que fait cette PR

<deux ou trois phrases, factuelles>

## Pourquoi

<le problème résolu, ou le besoin. Le « quoi » est dans le diff, pas ici.>

## Comment

- <décision d'implémentation notable>
- <alternative écartée, et pourquoi>

## Tests

| Couche | Ajoutés / modifiés | Ce qu'ils verrouillent |
|---|---|---|
| unitaire | | |
| fonctionnel | | |
| visuel | | |

Suite complète : ✅ / ❌ — `npm run lint`, `npx tsc --noEmit`, `npm test`.

Tests destructifs : voir le rapport en commentaire.

## Risques et points d'attention

- <ce qui pourrait casser, ce qu'il faut surveiller après déploiement>

## Migration / déploiement

- [ ] Aucune migration
- [ ] Migration incluse — appliquée par l'entrypoint au démarrage du conteneur
- [ ] Nouvelle variable `NEXT_PUBLIC_*` → **reconstruction obligatoire**, elle
      est inlinée dans le bundle à la construction

## Captures

<avant / après si l'interface change>
