# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 falls back to compiling from source when no prebuilt binary
# matches the target platform; these make that path work either way.
RUN apt-get update && apt-get install --no-install-recommends -y python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
	&& npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ARG LITESTREAM_VERSION=0.3.13
RUN apt-get update && apt-get install --no-install-recommends -y curl ca-certificates \
	&& curl -fsSL -o /tmp/litestream.deb \
		"https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.deb" \
	&& dpkg -i /tmp/litestream.deb \
	&& rm -rf /tmp/litestream.deb /var/lib/apt/lists/*

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY litestream.yml /etc/litestream.yml
RUN chmod +x scripts/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
