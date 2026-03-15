import 'dotenv/config';

// Raw diagnostics before any module initialisation — visible even if Pino or the
// app module throws during import.
console.log('[server] process starting, NODE_ENV=%s PORT=%s', process.env.NODE_ENV, process.env.PORT);

import app from './app';
import logger from './infrastructure/logger';

const PORT = process.env.PORT ?? 3001;

console.log('[server] app module loaded, binding to port', PORT);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'EnvSync API running');
  console.log('[server] listening on port', PORT);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
// When Railway (or any orchestrator) sends SIGTERM, finish in-flight requests
// before exiting so we don't drop active connections.

function shutdown(signal: string): void {
  console.log('[server] received %s — shutting down gracefully', signal);
  server.close(() => {
    console.log('[server] all connections closed, exiting');
    process.exit(0);
  });

  // Force-exit after 10 s if connections refuse to drain
  setTimeout(() => {
    console.error('[server] graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejection / exception guards ───────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
  // Log then exit — let Railway restart the container rather than running in a broken state
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err);
  process.exit(1);
});
