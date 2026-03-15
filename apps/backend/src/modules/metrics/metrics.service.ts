import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';

// A dedicated Registry keeps our metrics isolated (useful in tests — no global state bleed).
export const registry = new Registry();

// Tag every metric with the app name so dashboards can filter by service easily.
registry.setDefaultLabels({ app: 'envsync-backend' });

// Default metrics: Node.js heap, GC, event-loop lag, libuv active handles, CPU seconds, etc.
// These cover the USE method (Utilisation, Saturation, Errors) for the process itself.
collectDefaultMetrics({ register: registry });

// ── RED method ──────────────────────────────────────────────────────────────
// Rate     → http_requests_total
// Errors   → http_requests_total filtered by status_code >= 400
// Duration → http_request_duration_seconds

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets chosen for a typical REST API: fast ops at <100 ms, DB queries up to ~1 s
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [registry],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});
