import { Router } from 'express';
import { login, register, registerReader, getUser } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorizeAdmin';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorizeAdmin, register);
router.post('/register-reader', registerReader);
router.get('/me', authenticate, getUser);

export default router;