---
name: pyl-api-route
description: Use when creating, modifying or securing a REST route under src/app/api/. Covers the origin guard, the rate limiter, the replay contract, error codes and the two test layers a route needs.
---

# Créer ou modifier une route API

## L'ordre des gardes, et pourquoi

Dans un `POST`, dans cet ordre exact :

```ts
// 1. Origine — ne lit qu'un en-tête, ne touche aucun compteur partagé :
//    un refus ne coûte rien et ne consomme pas le quota d'un tiers.
if (!isTrustedOrigin(request)) {
    return Response.json({ error: 'forbidden_origin' }, { status: 403 });
}

// 2. Quota
const limit = limiter.check(clientKey(request));
if (!limit.allowed) { /* 429 + Retry-After */ }

// 3. Taille annoncée, AVANT de lire le corps
// 4. Analyse du corps, puis validation champ par champ
// 5. Écriture
```

Inverser 1 et 2 laisserait un appelant sans origine brûler du quota.

## Ce que chaque garde protège vraiment

- **`isTrustedOrigin`** (`src/lib/origin.ts`) : un autre site qui ferait poster
  ton visiteur à son insu. **Pas** un `curl`, qui pose l'en-tête qu'il veut.
- **`clientKey`** (`src/lib/rateLimit.ts`) : identifie par `x-real-ip`, à défaut
  par la **dernière** valeur de `x-forwarded-for`. Jamais la première : elle
  vient du client et rendait le quota inopérant.
- **Le rejeu** : la seule défense contre une partie forgée. Ne fais jamais
  confiance à un score envoyé.

Détail complet dans `.claude/rules/08-api-security.md`.

## Erreurs

L'API renvoie des **codes**, jamais des phrases : la traduction est côté
client. Un nouveau code se déclare dans `src/i18n/fr.ts` ET `en.ts`, section
`errors` — `en.ts` étant typé d'après `fr.ts`, l'oubli casse la compilation.

Ne renvoie pas la raison précise d'un rejet de rejeu : elle indiquerait à qui
fabrique une partie où sa suite d'actions a cloché.

## Tests — les deux couches sont nécessaires

| Couche | Ce qu'elle seule attrape |
|---|---|
| `src/app/api/…/route.test.ts` (Vitest, Prisma simulé) | la validation, cas par cas, sans base |
| `tests/functional/*.spec.ts` (Playwright) | que le garde est réellement **branché** sur la route |

Un helper juste qu'on oublie d'appeler passe tous les tests unitaires et laisse
l'API grande ouverte. C'est déjà arrivé ; c'est pour ça que les deux couches
sont obligatoires.

Les tests qui postent doivent poser `Origin` — via `SITE_ORIGIN`
(`tests/fixtures.ts`) en fonctionnel, en dur en unitaire. Sans lui : 403.

## Écriture en base

Passe par `prisma` de `src/lib/prisma.ts` (mandataire construit à la première
utilisation). Ne construis jamais un `PrismaClient` au niveau module : le build
Docker tourne sans base joignable et échouerait.
