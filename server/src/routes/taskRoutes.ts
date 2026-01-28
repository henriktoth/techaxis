import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createTask, deleteTask, getAllTasks, getTaskById, toggleTaskStatus, updateTask } from '../controllers/taskController';

const router = Router();

router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask)
router.put('/:id', authenticate, updateTask);
router.patch('/:id/toggle-status', authenticate, toggleTaskStatus);
router.delete('/:id', authenticate, deleteTask);

export default router;