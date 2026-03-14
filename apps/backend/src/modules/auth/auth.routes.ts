import { Router } from 'express';
import { register } from './auth.controller';

const router = Router();

router.post('/', register);

export default router;
