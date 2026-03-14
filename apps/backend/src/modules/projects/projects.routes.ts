import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { listHandler, createHandler } from './projects.controller';

const router = Router();

router.get('/', authMiddleware, listHandler as unknown as RequestHandler);
router.post('/', authMiddleware, createHandler as unknown as RequestHandler);

export default router;
