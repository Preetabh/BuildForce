import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DailyReportController } from './dailyReport.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createDailyReportSchema,
  updateDailyReportSchema,
  reviewDailyReportSchema,
} from './dailyReport.validation';

const router = Router();

// Setup disk storage for photos and document attachments
const uploadDir = path.join(process.cwd(), 'uploads', 'daily-reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(ext, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.use(authenticate);

router.get('/missing', DailyReportController.getMissingReports);
router.post('/upload', upload.array('files', 10), DailyReportController.uploadFiles);

router.get('/', DailyReportController.getReports);
router.post('/', validateBody(createDailyReportSchema), DailyReportController.createReport);

router.get('/:id', DailyReportController.getReportById);
router.patch('/:id', validateBody(updateDailyReportSchema), DailyReportController.updateReport);
router.post('/:id/review', validateBody(reviewDailyReportSchema), DailyReportController.reviewReport);

export default router;
