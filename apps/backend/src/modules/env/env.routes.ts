import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { pushHandler, pullHandler } from './env.controller';

const router = Router();

router.post('/', authMiddleware, pushHandler as unknown as RequestHandler);
router.get('/', authMiddleware, pullHandler as unknown as RequestHandler);

export default router;
