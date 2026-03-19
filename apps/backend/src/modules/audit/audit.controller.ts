import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as auditService from './audit.service';

export async function listHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;

    const result = await auditService.getAuditEvents(req.user!.id, {
      limit,
      cursor,
      action,
      source,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
