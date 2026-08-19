#!/usr/bin/env bash
# Crée la base de test et y applique le schéma. À lancer une fois après un
# clone, ou après un `npm run db:down -v` qui a effacé le volume MySQL.
set -euo pipefail

CONTAINER="${PYL_DB_CONTAINER:-pyl_db}"
ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-rootpassword}"

docker exec "$CONTAINER" mysql -uroot -p"$ROOT_PASSWORD" -e "
  CREATE DATABASE IF NOT EXISTS pushyourluck_test CHARACTER SET utf8mb4;
  GRANT ALL PRIVILEGES ON pushyourluck_test.* TO 'pushyourluck'@'%';
  FLUSH PRIVILEGES;" 2>/dev/null

DATABASE_URL="mysql://pushyourluck:pushyourluck@127.0.0.1:3307/pushyourluck_test" \
  npx prisma db push

echo "base de test prête : pushyourluck_test"
