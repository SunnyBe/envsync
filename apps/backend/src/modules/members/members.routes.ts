import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { inviteHandler, listHandler, removeHandler } from './members.controller';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, listHandler as unknown as RequestHandler);
router.post('/', authMiddleware, inviteHandler as unknown as RequestHandler);
router.delete('/:memberId', authMiddleware, removeHandler as unknown as RequestHandler);

export default router;
