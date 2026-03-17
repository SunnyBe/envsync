import prisma from '../../infrastructure/prisma/client';
import { encrypt, decrypt } from '../../services/encryption/encryption.service';
import { PushEnvInput, PullEnvInput, PullEnvOutput } from './env.types';
import { recordAudit } from '../audit/audit.service';
import { AppError } from '../../infrastructure/errors';

async function checkProjectAccess(
  projectId: string,
  requesterId: string,
  requiredRole: 'EDITOR' | 'VIEWER',
): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive) {
    throw new AppError('Project not found', 404);
  }

  // Owner always has full access
  if (project.ownerId === requesterId) return;

  // Check membership
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: requesterId, acceptedAt: { not: null } },
  });

  if (!member) {
    throw new AppError('Access denied', 403);
  }

  // Viewer cannot push
  if (requiredRole === 'EDITOR' && member.role === 'VIEWER') {
    throw new AppError('You have viewer access — editing is not allowed', 403);
  }
}

export async function pushVariables(input: PushEnvInput & { requesterId: string }): Promise<void> {
  const { projectId, env, variables, requesterId } = input;

  await checkProjectAccess(projectId, requesterId, 'EDITOR');

  for (const [key, value] of Object.entries(variables)) {
    const valueEnc = encrypt(value);
    await prisma.envVariable.upsert({
      where: { projectId_key_env: { projectId, key, env } } as any,
      update: { valueEnc, isActive: true },
      create: { projectId, key, valueEnc, env },
    });
  }

  await recordAudit({
    userId: requesterId,
    action: 'env.push',
    resourceType: 'project',
    resourceId: projectId,
    metadata: { env, count: Object.keys(variables).length },
  });
}

export async function pullVariables(
  input: PullEnvInput & { requesterId: string },
): Promise<PullEnvOutput> {
  const { projectId, env, requesterId } = input;

  await checkProjectAccess(projectId, requesterId, 'VIEWER');

  const records = await prisma.envVariable.findMany({
    where: { projectId, env, isActive: true },
  });
  const variables: Record<string, string> = {};
  for (const record of records) {
    variables[record.key] = decrypt(record.valueEnc);
  }

  await recordAudit({
    userId: requesterId,
    action: 'env.pull',
    resourceType: 'project',
    resourceId: projectId,
    metadata: { env, count: records.length },
  });

  return { variables };
}
