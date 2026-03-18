FROM node:20-alpine

WORKDIR /app

# Copy monorepo root manifests for workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm install --ignore-scripts --workspace=apps/web --workspace=packages/shared-types

# Copy source
COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
# Declare as ARG so Railway can pass --build-arg NEXT_PUBLIC_API_URL=...
# then promote to ENV so Next.js sees it during `next build`.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
