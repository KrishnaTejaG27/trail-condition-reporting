import { Router } from 'express';
import { register } from '@/controllers/authController';
import { login } from '@/controllers/authController';
import { validateRegister } from '@/middleware/validation';
import { validateLogin } from '@/middleware/validation';

const router = Router();

// Register new user
router.post('/register', validateRegister, register);

// Login user
router.post('/login', validateLogin, login);

export default router;
