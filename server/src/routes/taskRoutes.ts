import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createTask, deleteTask, getAllTasks, getTaskById, toggleTaskStatus, updateTask } from '../controllers/taskController';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, authorizeAdmin, createTask);
router.put('/:id', authenticate, authorizeAdmin, updateTask);
router.patch('/:id/toggle-status', authenticate, toggleTaskStatus);
router.delete('/:id', authenticate, authorizeAdmin, deleteTask);

export default router;