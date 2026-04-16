import { Router } from 'express';
import { register, login, logout, getMe } from '@/controllers/authController';
import { validateRegister } from '@/middleware/validation';
import { validateLogin } from '@/middleware/validation';
import { protect } from '@/middleware/auth';

const router = Router();

// Register new user
router.post('/register', validateRegister, register);

// Login user
router.post('/login', validateLogin, login);

// Logout user
router.post('/logout', protect, logout);

// Get current user
router.get('/me', protect, getMe);

export default router;
