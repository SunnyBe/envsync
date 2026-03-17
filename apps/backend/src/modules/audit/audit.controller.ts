import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as auditService from './audit.service';

export async function listHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await auditService.getAuditEvents(req.user!.id);
    res.json({ events });
  } catch (err) {
    next(err);
  }
}
