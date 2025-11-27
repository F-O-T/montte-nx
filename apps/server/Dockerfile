FROM oven/bun:1.2.23 AS builder


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
WORKDIR /app

# Copy all package manifests and the lockfile first.
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

COPY packages/transactional/package.json ./packages/transactional/
COPY packages/brasil-api/package.json ./packages/brasil-api/


# Install all dependencies (monorepo-aware)
RUN bun install

# Copy source code
COPY . .

ENV NODE_ENV=production
RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

# ---

# Stage 2: Create a clean, production-only node_modules folder and install ONNX Runtime
FROM oven/bun:1.2.23 AS deps
WORKDIR /app

# Copy all package manifests and lockfile again
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/localization/package.json ./packages/localization/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/ofx/package.json ./packages/ofx/
COPY libraries/ofx/package.json ./libraries/ofx/


COPY packages/brasil-api/package.json ./packages/brasil-api/

# Install only production dependencies.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM oven/bun:1.2.23 AS runner
WORKDIR /app

ENV NODE_ENV=production

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

# Copy the pruned, production-only node_modules from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Also copy the final package.json to the root of the app directory.
COPY --from=deps /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]

