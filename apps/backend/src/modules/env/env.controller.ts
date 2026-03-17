import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as envService from './env.service';
import { pushEnvSchema, pullEnvSchema, deleteEnvSchema } from './env.validation';

export async function pushHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const parsed = pushEnvSchema.safeParse({ env: req.query.env, ...req.body });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    await envService.pushVariables({
      projectId,
      env: parsed.data.env,
      variables: parsed.data.variables,
      requesterId: req.user!.id,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function pullHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = pullEnvSchema.safeParse({
      projectId: req.params.projectId,
      env: req.query.env,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const result = await envService.pullVariables({ ...parsed.data, requesterId: req.user!.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = deleteEnvSchema.safeParse({
      projectId: req.params.projectId,
      env: req.query.env,
      key: req.params.key,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    await envService.deleteVariable({ ...parsed.data, requesterId: req.user!.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
