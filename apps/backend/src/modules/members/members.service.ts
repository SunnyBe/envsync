import crypto from 'crypto';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { recordAudit } from '../audit/audit.service';

export async function inviteMember(
  projectId: string,
  email: string,
  role: 'EDITOR' | 'VIEWER',
  ownerId: string,
  ipAddress?: string,
): Promise<{ inviteToken: string }> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || !project.isActive) {
    const err: any = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  if (project.ownerId !== ownerId) {
    const err: any = new Error('Only the project owner can invite members');
    err.statusCode = 403;
    throw err;
  }

  // Check if already a member
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  if (existing) {
    const err: any = new Error('This email is already invited to the project');
    err.statusCode = 409;
    throw err;
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
    const err: any = new Error('Invite not found or already accepted');
    err.statusCode = 404;
    throw err;
  }

  if (member.email !== userEmail) {
    const err: any = new Error('This invite is for a different email address');
    err.statusCode = 403;
    throw err;
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
    const err: any = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // Must be owner or accepted member
  if (project.ownerId !== requesterId) {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: requesterId, acceptedAt: { not: null } },
    });
    if (!membership) {
      const err: any = new Error('Access denied');
      err.statusCode = 403;
      throw err;
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
    const err: any = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
  if (!member || member.projectId !== projectId) {
    const err: any = new Error('Member not found');
    err.statusCode = 404;
    throw err;
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
