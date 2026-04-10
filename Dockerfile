# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG GEINS_API_URL
ARG AUTH_SECRET
ARG BASE_URL
ARG GEINS_DEBUG

ENV GEINS_API_URL=${GEINS_API_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV BASE_URL=${BASE_URL}
ENV GEINS_DEBUG=${GEINS_DEBUG}
ENV NODE_ENV=production

RUN pnpm build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ARG GEINS_API_URL
ARG AUTH_SECRET
ARG BASE_URL
ARG GEINS_DEBUG

ENV GEINS_API_URL=${GEINS_API_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV BASE_URL=${BASE_URL}
ENV GEINS_DEBUG=${GEINS_DEBUG}
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./

EXPOSE 3000
CMD ["node", "server/index.mjs"]
