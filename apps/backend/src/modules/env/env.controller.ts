import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as envService from './env.service';
import { pushEnvSchema, pullEnvSchema } from './env.validation';

export async function pushHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const parsed = pushEnvSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    await envService.pushVariables({ projectId, env: parsed.data.env, variables: parsed.data.variables });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function pullHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = pullEnvSchema.safeParse({
      projectId: req.params.projectId,
      env: req.query.env,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const result = await envService.pullVariables(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
