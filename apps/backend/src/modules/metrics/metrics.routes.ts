import { Router, Request, Response, NextFunction } from 'express';
import { registry } from './metrics.service';

const router = Router();

/**
 * GET /metrics — Prometheus scrape endpoint.
 *
 * In production, restrict access to internal networks only (firewall/VPN).
 * Optionally protect with METRICS_SECRET env var for defence-in-depth.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret = process.env.METRICS_SECRET;
    if (secret && req.headers['x-metrics-token'] !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (err) {
    next(err);
  }
});

export default router;
