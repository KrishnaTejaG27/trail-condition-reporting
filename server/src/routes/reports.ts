import { Router } from 'express';
import { createReport } from '@/controllers/reportController';
import { getReports } from '@/controllers/reportController';
import { getReport } from '@/controllers/reportController';
import { updateReport } from '@/controllers/reportController';
import { deleteReport } from '@/controllers/reportController';
import { protect } from '@/middleware/auth';
import { validateCreateReport } from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/', getReports);
router.get('/:id', getReport);

// Protected routes
router.use(protect);
router.post('/', validateCreateReport, createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
