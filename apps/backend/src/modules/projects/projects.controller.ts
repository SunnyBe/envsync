import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as projectsService from './projects.service';
import { createProjectSchema, renameProjectSchema } from './projects.validation';

export async function getHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await projectsService.getProject(req.params.id, req.user!.id);
    res.json({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      userRole: project.userRole,
    });
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
    await projectsService.deleteProject(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projects = await projectsService.listProjects(req.user!.id);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function renameHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = renameProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const project = await projectsService.renameProject(
      req.params.id,
      req.user!.id,
      parsed.data.name,
    );
    res.json({ id: project.id, name: project.name });
  } catch (err) {
    next(err);
  }
}

export async function createHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const project = await projectsService.createProject({
      name: parsed.data.name,
      ownerId: req.user!.id,
    });
    res.status(201).json({ id: project.id, name: project.name });
  } catch (err) {
    next(err);
  }
}
