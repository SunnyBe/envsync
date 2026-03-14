import { Request, Response, NextFunction } from 'express';
import * as healthService from './health.service';

export function livenessHandler(_req: Request, res: Response): void {
  res.json({ status: 'ok' });
}

export async function readinessHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await healthService.getReadiness();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
}

export async function systemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Secured with HEALTH_SECRET env var — internal use only (not for public internet)
    const token = req.headers['x-health-token'];
    const expected = process.env.HEALTH_SECRET;
    if (!expected || token !== expected) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = await healthService.getSystemInfo();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
