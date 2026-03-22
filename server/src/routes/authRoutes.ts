import { Router } from 'express';
import { login, getUser } from '../controllers/authController';
import { createUser } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', login);
router.post('/register', createUser);
router.get('/me', authenticate, getUser);

export default router;
