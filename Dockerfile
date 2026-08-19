# syntax=docker/dockerfile:1

# ── Dépendances ──────────────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Construction ─────────────────────────────────────────────────────────────
FROM node:26-alpine AS builder
WORKDIR /app

# Les variables `NEXT_PUBLIC_*` sont INLINÉES dans le bundle envoyé au
# navigateur : les passer au démarrage du conteneur n'a aucun effet, il faut
# les fournir ici. Une valeur absente donne simplement une fonctionnalité
# désactivée — pas d'erreur de construction.
ARG NEXT_PUBLIC_SITE_URL=https://pushyourluck.net
ARG NEXT_PUBLIC_MATOMO_URL=""
ARG NEXT_PUBLIC_MATOMO_SITE_ID=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MATOMO_URL=$NEXT_PUBLIC_MATOMO_URL \
    NEXT_PUBLIC_MATOMO_SITE_ID=$NEXT_PUBLIC_MATOMO_SITE_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Le client Prisma est généré, pas installé : sans cette étape, les imports
# `@/generated/prisma` ne compilent pas.
RUN npx prisma generate && npm run build

# ── CLI de migration ─────────────────────────────────────────────────────────
# Les migrations sont jouées au DÉMARRAGE du conteneur applicatif, par
# l'entrypoint. Elles ne peuvent pas l'être pendant `docker build` : aucune
# base n'est joignable à ce moment-là, et c'est délibéré — la construction a
# justement été rendue indépendante de la base pour que le .env puisse sortir
# de l'image.
#
# La CLI est installée dans son PROPRE arbre, sous /opt/prisma, et non dans
# celui de l'application. Fusionner les deux `node_modules` écraserait des
# paquets @prisma/* dont la sortie standalone a besoin pour servir les
# requêtes, avec les versions que traîne la CLI.
#
# Le moteur de schéma est un binaire lié à la plateforme : celui d'un poste de
# développement Debian/Ubuntu est compilé pour glibc et ne s'exécuterait pas
# sur Alpine. C'est le script d'installation de Prisma qui télécharge la
# variante musl — d'où le seul `npm install` du Dockerfile à ne pas passer
# `--ignore-scripts`.
FROM node:26-alpine AS prisma-cli
WORKDIR /opt/prisma

COPY package-lock.json ./
# Prisma est une dépendance de DÉVELOPPEMENT : un `npm ci` complet installerait
# aussi Playwright, dont l'installation télécharge des navigateurs. On ne prend
# donc que la CLI, à la version EXACTE du verrou — une CLI qui dériverait du
# client généré appliquerait un SQL que le client ne sait pas interroger.
#
# La CLI pèse 252 Mo à elle seule (elle embarque Studio, `effect` et
# `@electric-sql`). Vérifié : en retirer quoi que ce soit, même le seul
# `@prisma/studio-core`, fait échouer `migrate deploy` — son build les importe
# tous au chargement. C'est à prendre ou à laisser.
#
# Le nettoyage du cache doit rester dans CE `RUN` : une couche Docker ne se
# soustrait pas, supprimer le cache ensuite laisserait ses 500 Mo dans l'image
# malgré leur absence du système de fichiers final.
RUN PRISMA_VERSION="$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
    && rm package-lock.json \
    && npm init -y > /dev/null \
    && npm install --no-audit --no-fund --loglevel=error "prisma@${PRISMA_VERSION}" dotenv \
    && npm cache clean --force

# `dotenv` accompagne la CLI parce que prisma.config.ts l'importe : c'est ce
# fichier qui porte l'URL de la base, le schéma ne la déclare pas. Les chemins
# qu'il contient sont relatifs, d'où le `cd /opt/prisma` de l'entrypoint.
COPY prisma.config.ts ./
COPY prisma ./prisma

# ── Binaire Node allégé ──────────────────────────────────────────────────────
# Le binaire officiel embarque ses tables de symboles : 20 Mo qui ne servent
# qu'à déboguer un plantage natif de Node lui-même. Les traces JavaScript, elles,
# n'en dépendent pas. Vérifié après strip : le binaire démarre et conserve
# l'ICU complet, indispensable au formatage des dates en français.
FROM node:26-alpine AS node-strip
RUN apk add --no-cache binutils \
    && cp /usr/local/bin/node /node \
    && strip --strip-unneeded /node

# ── Exécution ────────────────────────────────────────────────────────────────
# Base `alpine` nue plutôt que `node:26-alpine`, avec le seul binaire Node
# recopié. L'image officielle embarque npm (18 Mo), yarn, les en-têtes C++ et
# la documentation : rien de tout cela n'est utilisé pour lancer `server.js`.
# La sortie `standalone` de Next contient déjà les modules dont le serveur a
# besoin.
FROM alpine:3.22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# `libstdc++` est la seule dépendance système du binaire Node sous musl
# (elle tire `libgcc`). Sans elle, le conteneur démarre puis meurt sur un
# « Error loading shared library ».
RUN apk add --no-cache libstdc++ \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

COPY --from=node-strip /node /usr/local/bin/node

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# La CLI de migration, son moteur musl, le schéma et les migrations. Hors de
# /app, pour ne pas se mélanger au `node_modules` de la sortie standalone.
COPY --from=prisma-cli /opt/prisma /opt/prisma

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Coupe l'appel de vérification de version que Prisma passe au démarrage : en
# production il ne sert à rien, et il ajoute une latence — voire un échec — au
# lancement quand le conteneur n'a pas de sortie réseau.
ENV CHECKPOINT_DISABLE=1

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
