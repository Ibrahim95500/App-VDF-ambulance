# Compositeur multi-étapes pour l'application Next.js
FROM node:20-alpine AS base

# 1. Installer les dépendances seulement si nécessaire
FROM base AS deps
# Ajouter les outils nécessaires pour les dépendances binaires (comme sharp)
RUN apk add --no-cache libc6-compat build-base vips-dev
WORKDIR /app

# Configuration npm pour la résilience sur VPS
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set timeout 600000

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. Reconstruire le code source
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1

# Générer le client Prisma
RUN npx prisma generate

# Build de l'application (limite la RAM à 3GB pour éviter OOM sur VPS)
ENV NODE_OPTIONS="--max-old-space-size=3072"
RUN npm run build

# 3. Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Récupérer les fichiers nécessaires du builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
