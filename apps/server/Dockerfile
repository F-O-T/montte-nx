FROM oven/bun:alpine AS builder

ARG DATABASE_URL
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG RESEND_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ARG STRIPE_BASIC_PRICE_ID
ARG STRIPE_PRO_PRICE_ID
ARG STRIPE_BASIC_ANNUAL_PRICE_ID
ARG STRIPE_PRO_ANNUAL_PRICE_ID
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET

WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/api/package.json ./packages/api/
COPY libraries/ofx/package.json ./libraries/ofx/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/localization/package.json ./packages/localization/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/ofx/package.json ./packages/ofx/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/pdf/package.json ./packages/pdf/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/brasil-api/package.json ./packages/brasil-api/
COPY packages/stripe/package.json ./packages/stripe/

RUN bun install

COPY . .

ENV NODE_ENV=production

RUN cd libraries/ofx && bun run build

RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]