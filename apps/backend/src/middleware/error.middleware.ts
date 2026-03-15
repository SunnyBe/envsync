import { Request, Response, NextFunction } from 'express';
import logger from '../infrastructure/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  logger.error({ err, requestId: (req as any).id, statusCode }, 'Unhandled error');

  // Never expose internal error details (stack traces, DB errors) to the client.
  // 4xx errors are intentional and safe to surface; 5xx are internal failures.
  const clientMessage = statusCode < 500 ? err.message : 'Internal server error';
  res.status(statusCode).json({ error: clientMessage });
}
