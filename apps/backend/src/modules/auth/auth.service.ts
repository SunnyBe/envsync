import crypto from 'crypto';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { recordAudit } from '../audit/audit.service';
import { RegisterInput, RegisterOutput } from './auth.types';

export async function registerUser(input: RegisterInput): Promise<RegisterOutput> {
  const { email } = input;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && !existing.isActive) {
    logger.warn({ email }, 'Registration failed: account is deactivated');
    const err: any = new Error('This account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  if (existing) {
    logger.warn({ email }, 'Registration failed: email already registered');
    const err: any = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const apiToken = crypto.randomBytes(32).toString('hex');
  const user = await prisma.user.create({ data: { email, apiToken } });

  await recordAudit({ userId: user.id, action: 'auth.register', metadata: { email: user.email } });

  return { id: user.id, email: user.email, apiToken: user.apiToken };
}

export async function regenerateToken(userId: string): Promise<{ apiToken: string }> {
  const apiToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: userId }, data: { apiToken } });
  await recordAudit({ userId, action: 'auth.regenerate_token' });
  return { apiToken };
}
