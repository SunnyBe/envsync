import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { listHandler } from './audit.controller';

const router = Router();
router.get('/', authMiddleware, listHandler as unknown as RequestHandler);
export default router;
