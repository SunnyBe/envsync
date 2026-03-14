import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { push, pull } from './env.controller';

const router = Router();

router.post('/', authMiddleware, push as unknown as RequestHandler);
router.get('/', authMiddleware, pull as unknown as RequestHandler);

export default router;
