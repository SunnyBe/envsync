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
  logger.error(
    { err, requestId: (req as any).id, statusCode },
    'Unhandled error',
  );
  res.status(statusCode).json({ error: err.message });
}
