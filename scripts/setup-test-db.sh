#!/usr/bin/env bash
# Crée la base de test et y applique le schéma. À lancer une fois après un
# clone, ou après un `npm run db:down -v` qui a effacé le volume MySQL.
set -euo pipefail

CONTAINER="${PYL_DB_CONTAINER:-pyl_db}"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-rootpassword}"

# La base est REPOSÉE à neuf, pas seulement créée si absente : les migrations
# doivent s'appliquer depuis le vide, exactement comme sur une production
# fraîche. Une base de test conservée d'une version précédente masquerait une
# migration cassée — c'est ce qui a laissé passer une production sans table.
# Sans danger : ce script ne vise que `pushyourluck_test`, et les fixtures sont
# réinstallées ensuite par seed-test-db.ts.
docker exec "$CONTAINER" mysql -uroot -p"$ROOT_PASSWORD" -e "
  DROP DATABASE IF EXISTS pushyourluck_test;
  CREATE DATABASE pushyourluck_test CHARACTER SET utf8mb4;
  GRANT ALL PRIVILEGES ON pushyourluck_test.* TO 'pushyourluck'@'%';
  FLUSH PRIVILEGES;" 2>/dev/null

# `migrate deploy` et non `db push` : c'est la commande que joue la production.
# Les tests éprouvent donc le SQL réellement déployé, pas une projection du
# schéma que personne n'exécute jamais ailleurs.
DATABASE_URL="mysql://pushyourluck:pushyourluck@127.0.0.1:3307/pushyourluck_test" \
  npx prisma migrate deploy

echo "base de test prête : pushyourluck_test"
