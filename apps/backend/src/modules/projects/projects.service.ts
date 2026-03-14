import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { CreateProjectInput, ProjectOutput } from './projects.types';

export async function createProject(input: CreateProjectInput): Promise<ProjectOutput> {
  const { name, ownerId } = input;
  const project = await prisma.project.create({
    data: { name, ownerId },
  });
  logger.info({ projectId: project.id, ownerId }, 'Project created');
  return { id: project.id, name: project.name, createdAt: project.createdAt };
}

export async function listProjects(ownerId: string): Promise<ProjectOutput[]> {
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
  return (projects as any[]).map((p): ProjectOutput => ({ id: p.id, name: p.name, createdAt: p.createdAt }));
}
