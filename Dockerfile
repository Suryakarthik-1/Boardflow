# Multi-stage Dockerfile for Boardflow (Unified Client + Sync Server)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files for workspace resolution
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client
COPY packages/server ./packages/server

# Install all workspace dependencies
RUN npm install

# Build client SPA and server bundle
RUN npm run build --workspace @boardflow/client
RUN npm run build --workspace @boardflow/server

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_ORIGIN=*

# Copy manifests and install production dependencies
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

RUN npm install --omit=dev

# Copy compiled bundles from builder stage
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist

EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]
