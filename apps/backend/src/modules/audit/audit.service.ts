import { Prisma } from '@prisma/client';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { getAuditSource } from '../../middleware/request-context.middleware';

interface RecordAuditParams {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function recordAudit(params: RecordAuditParams): Promise<void> {
  const source = getAuditSource();
  const data: Prisma.AuditEventCreateInput = {
    user: { connect: { id: params.userId } },
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    ipAddress: params.ipAddress,
    source,
  };
  await prisma.auditEvent.create({ data });
  logger.info({ audit: true, ...params, source }, 'audit');
}

export interface AuditQueryParams {
  limit?: number;
  cursor?: string; // ID of the last seen event — fetch the next page after it
  action?: string;
  source?: string;
}

export interface AuditPage {
  events: {
    id: string;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    metadata: unknown;
    source: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }[];
  nextCursor: string | null;
}

export async function getAuditEvents(
  userId: string,
  params: AuditQueryParams = {},
): Promise<AuditPage> {
  const limit = Math.min(params.limit ?? 25, 100);

  const where: Prisma.AuditEventWhereInput = { userId };
  if (params.action) where.action = params.action;
  if (params.source) where.source = params.source;

  const events = await prisma.auditEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to know if there is a next page
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      metadata: true,
      source: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  const hasMore = events.length > limit;
  const page = hasMore ? events.slice(0, limit) : events;

  return {
    events: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
