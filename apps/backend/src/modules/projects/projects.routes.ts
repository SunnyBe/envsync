import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { list, create } from './projects.controller';

const router = Router();

router.get('/', authMiddleware, list as unknown as RequestHandler);
router.post('/', authMiddleware, create as unknown as RequestHandler);

export default router;
