import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { SorController } from './sor.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { env } from '../../config/env';

const router = Router();

// Ensure temporary upload directory exists
const tempUploadDir = path.resolve(process.cwd(), 'uploads/sor_temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer Disk Storage: Bypasses Node.js heap memory, writing chunks directly to disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `sor_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    // Configurable maximum file size in MB (default 250MB)
    fileSize: env.MAX_SOR_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.xlsx', '.xls', '.csv'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${allowed.join(', ')}`));
    }
  },
});

// 1. Configuration Endpoint (Public system limits)
router.get('/config', SorController.getConfig);

// Authentication on all remaining SOR endpoints
router.use(authenticate);

// 2. Rate Master Queries
router.get('/items/smart-search', requirePermission('sor.view'), SorController.smartSearchSorItems);
router.get('/items/subclauses', requirePermission('sor.view'), SorController.getSubclauses);
router.get('/schedules/hierarchy', requirePermission('sor.view'), SorController.getScheduleHierarchy);
router.get('/keywords', requirePermission('sor.view'), SorController.getDynamicKeywords);
router.get('/categories', requirePermission('sor.view'), SorController.getSorCategories);
router.get('/export', requirePermission('sor.view'), SorController.exportSor);
router.get('/items', requirePermission('sor.view'), SorController.getSorItems);
router.post('/items', requirePermission('sor.import'), SorController.createSorItem);
router.patch('/items/:itemId', requirePermission('sor.import'), SorController.updateSorItem);
router.delete('/items/:itemId', requirePermission('sor.import'), SorController.deleteSorItem);

router.get('/masters', requirePermission('sor.view'), SorController.getSorMasters);
router.post('/masters', requirePermission('sor.import'), SorController.createSorMaster);
router.patch('/masters/:masterId', requirePermission('sor.import'), SorController.updateSorMaster);
router.post('/masters/:masterId/duplicate', requirePermission('sor.import'), SorController.duplicateSorMaster);
router.patch('/masters/:masterId/archive', requirePermission('sor.import'), SorController.archiveSorMaster);
router.delete('/masters/:masterId/items', requirePermission('sor.import'), SorController.clearSorMasterItems);
router.delete('/masters/:masterId', requirePermission('sor.import'), SorController.deleteSorMaster);

// Dynamic Master Options & Recents
router.get('/masters/options', requirePermission('sor.view'), SorController.getMasterOptions);
router.post('/masters/options', requirePermission('sor.import'), SorController.createMasterOption);
router.post('/recent/:sorId', requirePermission('sor.view'), SorController.recordRecentSor);
router.get('/recents', requirePermission('sor.view'), SorController.getRecentSors);

// Keyword Aliases
router.get('/keyword-aliases', requirePermission('sor.view'), SorController.getKeywordAliases);
router.post('/keyword-aliases', requirePermission('sor.import'), SorController.createKeywordAlias);
router.patch('/keyword-aliases/:id', requirePermission('sor.import'), SorController.updateKeywordAlias);
router.delete('/keyword-aliases/:id', requirePermission('sor.import'), SorController.deleteKeywordAlias);
router.post('/keyword-aliases/bulk-import', requirePermission('sor.import'), SorController.bulkImportKeywordAliases);


// 3. Import History & Upload
router.get('/imports', requirePermission('sor.view'), SorController.listImports);
router.post(
  '/import/upload',
  requirePermission('sor.import'),
  upload.single('file'),
  SorController.uploadImport
);

// 4. Staging, Status, Review, and Batches
router.get('/import/:importId', requirePermission('sor.view'), SorController.getImportById);
router.get('/import/:importId/status', requirePermission('sor.view'), SorController.getImportStatus);
router.get('/import/:importId/rows', requirePermission('sor.view'), SorController.getStagedRows);
router.patch(
  '/import/:importId/rows/:rowId',
  requirePermission('sor.edit'),
  SorController.updateStagedRow
);
router.post(
  '/import/:importId/rows/bulk-approve',
  requirePermission('sor.edit'),
  SorController.bulkApproveStagedRows
);
router.post(
  '/import/:importId/batches/:batchNumber/retry',
  requirePermission('sor.import'),
  SorController.retryBatch
);
router.post(
  '/import/:importId/publish',
  requirePermission('sor.publish'),
  SorController.publishImport
);
router.delete(
  '/import/:importId',
  requirePermission('sor.import'),
  SorController.deleteImport
);
router.post(
  '/imports/reject-all',
  requirePermission('sor.import'),
  SorController.rejectAllImports
);
router.delete(
  '/imports/reject-all',
  requirePermission('sor.import'),
  SorController.rejectAllImports
);

export default router;
