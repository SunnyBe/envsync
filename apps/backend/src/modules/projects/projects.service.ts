import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { CreateProjectInput, ProjectOutput } from './projects.types';

export async function createProject(input: CreateProjectInput): Promise<ProjectOutput> {
  const { name, ownerId } = input;

  // findUnique works now because @@unique([name, ownerId]) is in the schema
  const existing = await prisma.project.findUnique({ where: { name_ownerId: { name, ownerId } } });

  if (existing && !existing.isActive) {
    logger.warn({ name, ownerId }, 'Project creation failed: project was deactivated');
    const err: any = new Error('A project with this name was previously deactivated');
    err.statusCode = 409;
    throw err;
  }

  if (existing) {
    logger.warn({ name, ownerId }, 'Project creation failed: project already exists');
    const err: any = new Error('Project with this name already exists');
    err.statusCode = 409;
    throw err;
  }

  const project = await prisma.project.create({ data: { name, ownerId } });
  logger.info({ projectId: project.id, ownerId }, 'Project created');
  return { id: project.id, name: project.name, createdAt: project.createdAt };
}

export async function listProjects(ownerId: string): Promise<ProjectOutput[]> {
  const projects = await prisma.project.findMany({
    where: { ownerId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return projects.map((p: { id: string; name: string; createdAt: Date }): ProjectOutput => ({ id: p.id, name: p.name, createdAt: p.createdAt }));
}
