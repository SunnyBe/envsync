import prisma from '../../infrastructure/prisma/client';
import { ReadinessResponse, SystemResponse } from './health.types';

async function checkDatabase(): Promise<'connected' | 'unreachable'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'unreachable';
  }
}

export async function getReadiness(): Promise<ReadinessResponse> {
  const database = await checkDatabase();
  return {
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
  };
}

export async function getSystemInfo(): Promise<SystemResponse> {
  const database = await checkDatabase();
  const mem = process.memoryUsage();
  return {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    database,
    node: process.version,
  };
}
