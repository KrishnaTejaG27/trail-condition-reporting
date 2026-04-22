import { Router } from 'express';
import { getTrails, getTrail, getNearbyTrails } from '@/controllers/trailController';

const router = Router();

// Public routes
router.get('/', getTrails);
router.get('/nearby', getNearbyTrails);
router.get('/:id', getTrail);

export default router;
