import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as projectsService from './projects.service';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectsService.listProjects(req.user!.id);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const project = await projectsService.createProject({ name, ownerId: req.user!.id });
    res.status(201).json({ id: project.id, name: project.name });
  } catch (err) {
    next(err);
  }
}
