import { Request, Response, NextFunction } from 'express';
import prisma from '../infrastructure/prisma/client';
import logger from '../infrastructure/logger';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; apiToken: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    logger.warn({ requestId: (req as any).id }, 'Auth failed: missing or invalid Authorization header');
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = header.slice(7);
  const user = await prisma.user.findUnique({ where: { apiToken: token } });
  if (!user) {
    logger.warn({ requestId: (req as any).id }, 'Auth failed: invalid token');
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  req.user = user;
  next();
}
