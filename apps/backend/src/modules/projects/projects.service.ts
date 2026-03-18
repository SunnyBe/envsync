import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { recordAudit } from '../audit/audit.service';
import { CreateProjectInput, ProjectOutput, ProjectDetailOutput } from './projects.types';
import { AppError } from '../../infrastructure/errors';

export async function createProject(input: CreateProjectInput): Promise<ProjectOutput> {
  const { name, ownerId } = input;

  // findUnique works now because @@unique([name, ownerId]) is in the schema
  const existing = await prisma.project.findUnique({ where: { name_ownerId: { name, ownerId } } });

  if (existing && !existing.isActive) {
    logger.warn({ name, ownerId }, 'Project creation failed: project was deactivated');
    throw new AppError('A project with this name was previously deactivated', 409);
  }

  if (existing) {
    logger.warn({ name, ownerId }, 'Project creation failed: project already exists');
    throw new AppError('Project with this name already exists', 409);
  }

  const project = await prisma.project.create({ data: { name, ownerId } });

  await recordAudit({
    userId: ownerId,
    action: 'project.create',
    resourceType: 'project',
    resourceId: project.id,
    metadata: { name },
  });

  return { id: project.id, name: project.name, createdAt: project.createdAt };
}

export async function deleteProject(projectId: string, ownerId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive || project.ownerId !== ownerId) {
    throw new AppError('Project not found', 404);
  }

  await prisma.project.update({ where: { id: projectId }, data: { isActive: false } });

  await recordAudit({
    userId: ownerId,
    action: 'project.delete',
    resourceType: 'project',
    resourceId: projectId,
  });
}

export async function renameProject(
  projectId: string,
  ownerId: string,
  newName: string,
): Promise<ProjectOutput> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive || project.ownerId !== ownerId) {
    throw new AppError('Project not found', 404);
  }

  const conflict = await prisma.project.findUnique({
    where: { name_ownerId: { name: newName, ownerId } },
  });

  if (conflict) {
    throw new AppError('Project with this name already exists', 409);
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: newName },
  });

  await recordAudit({
    userId: ownerId,
    action: 'project.rename',
    resourceType: 'project',
    resourceId: projectId,
    metadata: { oldName: project.name, newName },
  });

  return { id: updated.id, name: updated.name, createdAt: updated.createdAt };
}

export async function getProject(projectId: string, userId: string): Promise<ProjectDetailOutput> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId === userId) {
    return { id: project.id, name: project.name, createdAt: project.createdAt, userRole: 'owner' };
  }

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, acceptedAt: { not: null } },
  });

  if (!member) {
    throw new AppError('Project not found', 404);
  }

  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    userRole: member.role as 'EDITOR' | 'VIEWER',
  };
}

export async function listProjects(ownerId: string): Promise<ProjectOutput[]> {
  const projects = await prisma.project.findMany({
    where: { ownerId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return projects.map(
    (p: { id: string; name: string; createdAt: Date }): ProjectOutput => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
    }),
  );
}
