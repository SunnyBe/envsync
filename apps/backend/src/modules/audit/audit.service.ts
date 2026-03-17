import { Prisma } from '@prisma/client';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';

interface RecordAuditParams {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function recordAudit(params: RecordAuditParams): Promise<void> {
  const data: Prisma.AuditEventCreateInput = {
    user: { connect: { id: params.userId } },
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
    ipAddress: params.ipAddress,
  };
  await prisma.auditEvent.create({ data });
  logger.info({ audit: true, ...params }, 'audit');
}

export async function getAuditEvents(userId: string, limit = 50) {
  return prisma.auditEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
