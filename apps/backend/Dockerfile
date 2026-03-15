FROM node:20-alpine

# Prisma's schema engine (Rust binary) requires OpenSSL, which Alpine omits by default
RUN apk add --no-cache openssl

WORKDIR /app

# Copy monorepo root manifests (for npm workspaces + layer caching)
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm install --workspace=apps/backend --workspace=packages/shared-types

# Copy source
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

WORKDIR /app/apps/backend

RUN npm run build

RUN npx prisma generate

# Copy and permission the startup script
COPY apps/backend/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001

# Use exec in start.sh so node becomes PID 1 (required for proper signal handling and log capture)
CMD ["./start.sh"]
