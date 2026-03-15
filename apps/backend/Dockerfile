FROM node:20-alpine

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

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
