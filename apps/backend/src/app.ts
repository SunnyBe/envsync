import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';

import logger from './infrastructure/logger';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import healthRouter from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import projectsRouter from './modules/projects/projects.routes';
import envRouter from './modules/env/env.routes';

const app = express();

app.use(requestIdMiddleware);
app.use(pinoHttp({ logger }));
// ALLOWED_ORIGINS: comma-separated permitted origins.
// e.g. "http://localhost:3000,https://envsync.up.railway.app"
// Falls back to reflecting any origin (true) when the var is not set — safe for local dev only.
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins ?? true, credentials: true }));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/projects', projectsRouter);
app.use('/projects/:projectId/env', envRouter);

app.use(errorMiddleware);

export default app;
