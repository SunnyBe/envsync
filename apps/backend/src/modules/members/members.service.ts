import crypto from 'crypto';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { recordAudit } from '../audit/audit.service';
import { AppError } from '../../infrastructure/errors';

export async function inviteMember(
  projectId: string,
  email: string,
  role: 'EDITOR' | 'VIEWER',
  ownerId: string,
  ipAddress?: string,
): Promise<{ inviteToken: string }> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== ownerId) {
    throw new AppError('Only the project owner can invite members', 403);
  }

  // Check if already a member
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  if (existing) {
    throw new AppError('This email is already invited to the project', 409);
  }

  const inviteToken = crypto.randomBytes(16).toString('hex');
  await prisma.projectMember.create({
    data: { projectId, email, role, inviteToken },
  });

  await recordAudit({
    userId: ownerId,
    action: 'project.invite_member',
    resourceType: 'project',
    resourceId: projectId,
    metadata: { email, role },
    ipAddress,
  });

  logger.info({ projectId, email, role }, 'Member invited');
  return { inviteToken };
}

export async function acceptInvite(
  inviteToken: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  const member = await prisma.projectMember.findUnique({ where: { inviteToken } });

  if (!member || member.acceptedAt) {
    throw new AppError('Invite not found or already accepted', 404);
  }

  if (member.email !== userEmail) {
    throw new AppError('This invite is for a different email address', 403);
  }

  await prisma.projectMember.update({
    where: { id: member.id },
    data: { userId, acceptedAt: new Date() },
  });

  await recordAudit({
    userId,
    action: 'project.accept_invite',
    resourceType: 'project',
    resourceId: member.projectId,
  });
}

export async function listMembers(projectId: string, requesterId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive) {
    throw new AppError('Project not found', 404);
  }

  // Must be owner or accepted member
  if (project.ownerId !== requesterId) {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: requesterId, acceptedAt: { not: null } },
    });
    if (!membership) {
      throw new AppError('Access denied', 403);
    }
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { email: true, id: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return members.map((m) => ({
    id: m.id,
    email: m.email,
    role: m.role,
    accepted: !!m.acceptedAt,
    userId: m.userId,
    createdAt: m.createdAt,
  }));
}

export async function removeMember(
  projectId: string,
  memberId: string,
  ownerId: string,
): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || project.ownerId !== ownerId) {
    throw new AppError('Project not found', 404);
  }

  const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
  if (!member || member.projectId !== projectId) {
    throw new AppError('Member not found', 404);
  }

  await prisma.projectMember.delete({ where: { id: memberId } });

  await recordAudit({
    userId: ownerId,
    action: 'project.remove_member',
    resourceType: 'project',
    resourceId: projectId,
    metadata: { removedEmail: member.email },
  });
}
