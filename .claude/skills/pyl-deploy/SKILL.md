---
name: pyl-deploy
description: Use when deploying to production, changing the Dockerfile or docker-compose, or debugging why something works locally but not on pushyourluck.net — especially anything involving NEXT_PUBLIC_* variables, Matomo or the database schema.
---

# Déployer

```bash
# .env du serveur : MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, NEXT_PUBLIC_*
docker compose -p pushyourluck up -d --build
```

`--build` n'est pas optionnel : voir ci-dessous.

## Construction contre exécution — la distinction qui coûte cher

| Ce qui est figé à la CONSTRUCTION | Ce qui est lu à l'EXÉCUTION |
|---|---|
| toutes les `NEXT_PUBLIC_*`, inlinées dans le bundle navigateur | `DATABASE_URL`, mots de passe |
| | la CSP de `next.config.ts`, recalculée à chaque démarrage |

Conséquence : **la CSP peut mentionner correctement l'hôte Matomo pendant que
le bundle embarque encore l'ancienne valeur.** Deux sources, deux moments, deux
vérités. Un `.env` corrigé sans reconstruction ne change rien au navigateur.

Diagnostiquer dans cet ordre :

```bash
# 1. runtime : la CSP mentionne-t-elle l'instance ?
curl -sI https://pushyourluck.net | grep -i content-security-policy

# 2. la cible existe-t-elle ? un idsite inconnu répond 400 en silence
curl -so /dev/null -w '%{http_code}\n' \
  "https://matomo.leoderoin.fr/matomo.php?idsite=6&rec=1&url=https%3A%2F%2Fpushyourluck.net%2F&action_name=probe&rand=1&apiv=1"

# 3. build : quelle valeur est réellement dans le bundle ?
curl -s https://pushyourluck.net | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u \
  | while read -r c; do curl -s "https://pushyourluck.net$c"; done | grep -o 'MATOMO_SITE_ID[^,]*,[^,]*,"[0-9]*"'
```

Les points 1 et 2 peuvent être verts alors que rien n'est mesuré. Le point 3
tranche.

## Le schéma de la base

Appliqué par `docker-entrypoint.sh` avant le démarrage de Next. Si la migration
échoue, le conteneur s'arrête plutôt que de servir une application dont le
schéma ne correspond pas au code. Voir `pyl-prisma-migration`.

## Contraintes de la stack

- **Le `.env` n'entre jamais dans l'image** (exclu du contexte) : Next le
  recopierait dans la sortie standalone.
- **Le port 3001 est aussi celui du loup-garou** en production → poser
  `PYL_HOST_PORT=3005` si les deux cohabitent.
- **Le conteneur applicatif est lié à la boucle locale** : il n'est joignable
  que par nginx. Le deux-points après l'adresse est obligatoire —
  `127.0.0.1${PORT}` produit `127.0.0.13001`, que Docker rejette.
- **Publier un port de base de données sans préfixe `127.0.0.1:` l'expose sur
  toutes les interfaces**, et Docker écrit sa règle en amont d'UFW : un
  `ufw deny` ne la bloquera pas.

## Après déploiement

Vérifie une visite en temps réel dans Matomo, et que `/api/health` répond
`{"status":"ok","db":"up"}`.
