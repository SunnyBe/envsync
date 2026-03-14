import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// This middleware adds a request ID to the request and response objects. This is used to identify the request in the logs.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = uuidv4();
  (req as any).id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
