import { Router } from 'express';
import { livenessHandler, readinessHandler, systemHandler } from './health.controller';

const router = Router();

// GET /health/live — liveness probe (Kubernetes: is the process alive?)
router.get('/live', livenessHandler);

// GET /health/ready — readiness probe (Kubernetes: is it ready to serve traffic?)
router.get('/ready', readinessHandler);

// GET /health/system — detailed system info (requires X-Health-Token header)
router.get('/system', systemHandler);

export default router;
