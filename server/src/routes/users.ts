import { Router } from 'express';
import { getProfile } from '@/controllers/userController';
import { updateProfile } from '@/controllers/userController';
import { protect } from '@/middleware/auth';

const router = Router();

// All user routes require authentication
router.use(protect);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', updateProfile);

export default router;
