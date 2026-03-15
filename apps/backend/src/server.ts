import 'dotenv/config';
import app from './app';
import logger from './infrastructure/logger';

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
