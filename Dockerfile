FROM node:26-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY tsconfig.base.json ./
COPY server/ server/
COPY client/ client/
RUN npm run build -w client
RUN npm run build -w server

FROM node:26-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci -w server --omit=dev

COPY --from=builder /app/server/dist server/dist
COPY --from=builder /app/server/src/db/migrations server/dist/db/migrations
COPY --from=builder /app/client/dist client/dist

RUN apk add --no-cache su-exec \
  && mkdir -p /app/data \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3060
ENV DATA_DIR=/app/data

EXPOSE 3060

HEALTHCHECK --interval=5m --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3060/api/health || exit 1

ENTRYPOINT ["/bin/sh", "-c", "chown -R node:node /app/data && exec su-exec node node server/dist/index.js"]
