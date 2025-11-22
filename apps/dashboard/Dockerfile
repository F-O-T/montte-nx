# apps/dashboard/Dockerfile
FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

# Copy package files
COPY bun.lock ./
COPY package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/localization/package.json ./packages/localization/
COPY packages/contenta-sdk/package.json ./packages/contenta-sdk/
COPY packages/ui/package.json ./packages/ui/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/environment/package.json ./packages/environment/
COPY packages/database/package.json ./packages/database/
COPY packages/files/package.json ./packages/files/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/utils/package.json ./packages/utils/
COPY packages/brasil-api/package.json ./packages/brasil-api/

# Install dependencies
RUN npm install -g bun && bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the dashboard application
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN bun run --filter=dashboard build

# Production stage
FROM nginx:stable-alpine AS production

WORKDIR /app

COPY apps/dashboard/nginx.conf /etc/nginx/nginx.conf
COPY --from=base /app/apps/dashboard/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl --fail --silent http://0.0.0.0:80/healthcheck || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
