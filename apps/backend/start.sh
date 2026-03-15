#!/bin/sh
set -e

echo "[start.sh] CWD=$(pwd)"
echo "[start.sh] NODE=$(node --version), NPM=$(npm --version)"
echo "[start.sh] PORT=${PORT:-not set}"

echo "[start.sh] Running database migrations..."
npx prisma migrate deploy

echo "[start.sh] Migration complete. Checking dist/..."
ls -la dist/server.js 2>&1 || echo "[start.sh] ERROR: dist/server.js not found!"

echo "[start.sh] Starting server..."
exec node dist/server.js
