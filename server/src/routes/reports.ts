import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createReport } from '@/controllers/reportController';
import { getReports } from '@/controllers/reportController';
import { getReport } from '@/controllers/reportController';
import { updateReport } from '@/controllers/reportController';
import { deleteReport } from '@/controllers/reportController';
import { uploadPhoto } from '@/controllers/reportController';
import { upvoteReport } from '@/controllers/reportController';
import { removeUpvote } from '@/controllers/reportController';
import { getReportComments } from '@/controllers/reportController';
import { addReportComment } from '@/controllers/reportController';
import { updateComment } from '@/controllers/reportController';
import { deleteComment } from '@/controllers/reportController';
import { protect } from '@/middleware/auth';
import { validateCreateReport } from '@/middleware/validation';

const router = Router();

// Configure multer for memory storage (S3 uploads)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Public routes
router.get('/', getReports);
router.get('/:id', getReport);

// Protected routes
router.use(protect);
router.post('/', validateCreateReport, createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);
router.post('/:id/photos', upload.single('photo'), uploadPhoto);
router.post('/:id/upvote', upvoteReport);
router.delete('/:id/upvote', removeUpvote);
router.get('/:id/comments', getReportComments);
router.post('/:id/comments', addReportComment);
router.put('/:id/comments/:commentId', updateComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;
