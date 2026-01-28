import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/userController';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.get('/', authenticate, authorizeAdmin, getAllUsers);
router.get('/:id', authenticate, authorizeAdmin, getUserById);
router.put('/:id', authenticate, authorizeAdmin, updateUser);
router.delete('/:id', authenticate, authorizeAdmin, deleteUser);

export default router;