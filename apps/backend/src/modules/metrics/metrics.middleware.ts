import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestsTotal } from './metrics.service';

/**
 * Records RED method metrics for every HTTP request.
 *
 * We use res.on('finish') so we capture the final status code AFTER the
 * handler runs. req.route.path is only populated by then too, giving us
 * the parameterised path (e.g. "/projects/:projectId") instead of the raw
 * URL (e.g. "/projects/abc-123") — this prevents high-cardinality label
 * explosion in Prometheus.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    // Build the parameterised route label, fall back to raw path for unmatched routes (404s).
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    endTimer(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}
