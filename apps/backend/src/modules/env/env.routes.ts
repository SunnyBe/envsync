import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { pushHandler, pullHandler, deleteHandler } from './env.controller';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, pushHandler as unknown as RequestHandler);
router.get('/', authMiddleware, pullHandler as unknown as RequestHandler);
router.delete('/:key', authMiddleware, deleteHandler as unknown as RequestHandler);

export default router;
