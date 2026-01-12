import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getAllTasks, getTaskById } from '../controllers/taskController';

const router = Router();

router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);

export default router;