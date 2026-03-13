import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createUser, deleteUser, getAllUsers, getUserById, toggleUserDisabled, updateUser } from '../controllers/userController';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.post('/register', createUser);
router.get('/', authenticate, authorizeAdmin, getAllUsers);
router.post('/', authenticate, authorizeAdmin, createUser);
router.get('/:id', authenticate, authorizeAdmin, getUserById);
router.put('/:id', authenticate, authorizeAdmin, updateUser);
router.patch('/:id/toggle-disabled', authenticate, authorizeAdmin, toggleUserDisabled);
router.delete('/:id', authenticate, authorizeAdmin, deleteUser);

export default router;