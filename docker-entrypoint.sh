#!/bin/sh
# Applique les migrations en attente, puis passe la main au serveur Next.
#
# `set -e` n'est pas une précaution de style : si la migration échoue, le
# conteneur doit S'ARRÊTER plutôt que servir une application dont le schéma ne
# correspond pas au code. Rien d'autre ne le remarquerait — Next démarre très
# bien sur une base sans table, le healthcheck passe, et la panne n'apparaît
# qu'à la première requête d'un visiteur (« The table `Score` does not exist »).
set -e

# La CLI vit dans son propre arbre de dépendances : on s'y déplace le temps de
# la commande, parce que les chemins de prisma.config.ts sont relatifs. Le
# sous-shell évite d'emporter ce changement de dossier jusqu'au serveur, qui
# doit démarrer depuis /app.
#
# Pas d'attente de la base ici : Compose ne lance ce conteneur qu'une fois
# `pyl_db` déclaré sain. Si elle disparaît malgré tout, la migration échoue,
# le conteneur sort, et `restart: unless-stopped` le relance — ce qui est le
# comportement voulu.
(
  cd /opt/prisma
  echo "[migrate] application des migrations en attente…"
  node node_modules/prisma/build/index.js migrate deploy
)

echo "[migrate] schéma à jour, démarrage de l'application."
exec "$@"
