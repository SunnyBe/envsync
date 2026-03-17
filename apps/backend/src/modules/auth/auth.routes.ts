import { Router, RequestHandler } from 'express';
import { register, me, regenerate } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { acceptHandler } from '../members/members.controller';

const router = Router();

router.post('/register', register);
router.get('/me', authMiddleware, me);
router.post('/regenerate', authMiddleware, regenerate as unknown as RequestHandler);
router.post('/invites/:inviteToken/accept', authMiddleware, acceptHandler as unknown as RequestHandler);

export default router;
