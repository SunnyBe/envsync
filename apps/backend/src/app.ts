import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import logger from './infrastructure/logger';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestContextMiddleware } from './middleware/request-context.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import healthRouter from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import projectsRouter from './modules/projects/projects.routes';
import envRouter from './modules/env/env.routes';
import metricsRouter from './modules/metrics/metrics.routes';
import auditRouter from './modules/audit/audit.routes';
import membersRouter from './modules/members/members.routes';
import { metricsMiddleware } from './modules/metrics/metrics.middleware';

const app = express();

// Trust the first proxy hop (Railway, Heroku, etc.) so req.ip reflects the real client IP,
// which is required for rate limiting to work correctly.
app.set('trust proxy', 1);

// General rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints: 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(requestIdMiddleware);
app.use(requestContextMiddleware);
app.use(pinoHttp({ logger }));
// Collect RED metrics for every request — must be registered before route handlers
app.use(metricsMiddleware);
// ALLOWED_ORIGINS: comma-separated permitted origins.
// e.g. "http://localhost:3000,https://envsync.up.railway.app"
// Falls back to reflecting any origin (true) when the var is not set — safe for local dev only.
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins ?? true, credentials: true }));
app.use(express.json({ limit: '10kb' }));

app.use(generalLimiter);

app.use('/auth/register', authLimiter);
app.use('/auth/regenerate', authLimiter);

app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/auth', authRouter);
app.use('/projects', projectsRouter);
app.use('/projects/:projectId/env', envRouter);
app.use('/projects/:projectId/members', membersRouter);
app.use('/audit', auditRouter);

app.use(errorMiddleware);

export default app;
