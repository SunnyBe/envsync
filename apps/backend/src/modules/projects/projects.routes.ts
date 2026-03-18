import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  listHandler,
  getHandler,
  createHandler,
  deleteHandler,
  renameHandler,
} from './projects.controller';

const router = Router();

router.get('/', authMiddleware, listHandler as unknown as RequestHandler);
router.post('/', authMiddleware, createHandler as unknown as RequestHandler);
router.get('/:id', authMiddleware, getHandler as unknown as RequestHandler);
router.patch('/:id', authMiddleware, renameHandler as unknown as RequestHandler);
router.delete('/:id', authMiddleware, deleteHandler as unknown as RequestHandler);

export default router;
