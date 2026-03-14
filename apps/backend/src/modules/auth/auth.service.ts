import crypto from 'crypto';
import prisma from '../../infrastructure/prisma/client';
import logger from '../../infrastructure/logger';
import { RegisterInput, RegisterOutput } from './auth.types';

export async function registerUser(input: RegisterInput): Promise<RegisterOutput> {
  const { email } = input;

  // Find by email only — we need to inspect isActive ourselves
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

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  return { id: user.id, email: user.email, apiToken: user.apiToken };
}
