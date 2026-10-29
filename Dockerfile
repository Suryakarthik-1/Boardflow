# Multi-stage Dockerfile for Boardflow (Unified Frontend + Fastify Sync Server)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

RUN npm ci

# Copy all source files
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client
COPY packages/server ./packages/server

# Build the client SPA (outputs to packages/client/dist)
RUN npm run build --workspace @boardflow/client

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_ORIGIN=*

# Copy package manifests and install production dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

RUN npm ci --omit=dev

# Copy source and built assets needed at runtime
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server ./packages/server
COPY --from=builder /app/packages/client/dist ./packages/client/dist

EXPOSE 8080

CMD ["npx", "tsx", "packages/server/src/index.ts"]
