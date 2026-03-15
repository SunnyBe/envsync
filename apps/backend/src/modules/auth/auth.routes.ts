import { Router } from 'express';
import { register, me } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.get('/me', authMiddleware, me);

export default router;
