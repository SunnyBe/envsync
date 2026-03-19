import 'dotenv/config';
import app from './app';
import logger from './infrastructure/logger';

// Validate required env vars before binding to a port — fail fast with a clear message.
const missing: string[] = [];
if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
if (!process.env.ENV_SYNC_SECRET) {
  missing.push('ENV_SYNC_SECRET');
} else if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENV_SYNC_SECRET)) {
  logger.error('ENV_SYNC_SECRET must be exactly 64 hex characters (32 bytes)');
  process.exit(1);
}
if (missing.length > 0) {
  logger.error({ missing }, 'Missing required environment variables');
  process.exit(1);
}

const PORT = process.env.PORT ?? 3001;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'EnvSync API running');
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
// When Railway (or any orchestrator) sends SIGTERM, finish in-flight requests
// before exiting so we don't drop active connections.

function shutdown(signal: string): void {
  logger.info({ signal }, 'shutting down gracefully');
  server.close(() => {
    logger.info('all connections closed, exiting');
    process.exit(0);
  });

  // Force-exit after 10 s if connections refuse to drain
  setTimeout(() => {
    logger.error('graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejection / exception guards ───────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException');
  process.exit(1);
});
