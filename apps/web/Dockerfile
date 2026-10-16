# syntax=docker/dockerfile:1
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# devDependencies are required: the build imports shadcn/tailwind CSS from them.
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:25-alpine AS builder
WORKDIR /app
# Next.js evaluates rewrites at BUILD time and bakes them into the standalone server.
ARG API_INTERNAL_URL=http://api:8000
ENV API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:25-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 10001 nextjs && adduser -S -u 10001 -G nextjs nextjs
WORKDIR /app
# Application files stay root-owned: the runtime user cannot modify code.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Only the Next.js cache directory is writable at runtime.
RUN mkdir -p .next/cache && chown nextjs:nextjs .next/cache
USER 10001:10001
EXPOSE 3000
CMD ["node", "server.js"]
