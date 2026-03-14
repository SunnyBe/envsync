import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as envService from './env.service';

export async function push(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId, env, variables } = req.body;
    if (!projectId || !env || !variables) {
      res.status(400).json({ error: 'projectId, env, and variables are required' });
      return;
    }
    await envService.pushVariables({ projectId, env, variables });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function pull(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId, env } = req.query as { projectId: string; env: string };
    if (!projectId || !env) {
      res.status(400).json({ error: 'projectId and env are required' });
      return;
    }
    const result = await envService.pullVariables({ projectId, env });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
