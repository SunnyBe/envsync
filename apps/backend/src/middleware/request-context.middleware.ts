import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export type AuditSource = 'cli' | 'web' | 'manual';

const VALID_SOURCES: AuditSource[] = ['cli', 'web', 'manual'];
const SOURCE_HEADER = 'x-envsync-source';

export const requestContext = new AsyncLocalStorage<{ source: AuditSource }>();

export function getAuditSource(): AuditSource {
  return requestContext.getStore()?.source ?? 'manual';
}

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const raw = (req.headers[SOURCE_HEADER] as string)?.toLowerCase()?.trim();
  const source: AuditSource =
    raw && VALID_SOURCES.includes(raw as AuditSource) ? (raw as AuditSource) : 'manual';

  requestContext.run({ source }, () => next());
}
