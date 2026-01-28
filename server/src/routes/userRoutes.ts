import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getAllUsers } from '../controllers/userController';

const router = Router();

router.get('/', authenticate, getAllUsers);

export default router;