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

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
