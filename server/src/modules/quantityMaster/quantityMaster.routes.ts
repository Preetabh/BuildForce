import { Router } from 'express';
import multer from 'multer';
import { QuantityMasterController } from './quantityMaster.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireCompany } from '../../middleware/company.middleware';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

// Materials
router.get('/materials', QuantityMasterController.getMaterials);
router.post('/materials', QuantityMasterController.createMaterial);
router.patch('/materials/:id/archive', QuantityMasterController.toggleMaterialArchive);
router.patch('/materials/:id', QuantityMasterController.updateMaterial);
router.delete('/materials/:id', QuantityMasterController.deleteMaterial);

// Manpower
router.get('/manpower', QuantityMasterController.getManpower);
router.post('/manpower', QuantityMasterController.createManpower);
router.patch('/manpower/:id/archive', QuantityMasterController.toggleManpowerArchive);
router.patch('/manpower/:id', QuantityMasterController.updateManpower);
router.delete('/manpower/:id', QuantityMasterController.deleteManpower);

// Machinery
router.get('/machinery', QuantityMasterController.getMachinery);
router.post('/machinery', QuantityMasterController.createMachinery);
router.patch('/machinery/:id/archive', QuantityMasterController.toggleMachineryArchive);
router.patch('/machinery/:id', QuantityMasterController.updateMachinery);
router.delete('/machinery/:id', QuantityMasterController.deleteMachinery);

// Formulas
router.get('/formulas', QuantityMasterController.getFormulas);
router.post('/formulas', QuantityMasterController.createFormula);
router.patch('/formulas/:id', QuantityMasterController.updateFormula);
router.post('/formulas/:id/copy', QuantityMasterController.copyFormula);
router.delete('/formulas/:id', QuantityMasterController.deleteFormula);

// Rate Lists
router.get('/rate-lists', QuantityMasterController.getRateLists);
router.post('/rate-lists', QuantityMasterController.createRateList);
router.get('/rate-lists/:id', QuantityMasterController.getRateListById);
router.put('/rate-lists/:id/overrides', QuantityMasterController.updateRateListOverrides);
router.delete('/rate-lists/:id', QuantityMasterController.deleteRateList);

import path from 'path';

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.xlsx', '.xls', '.csv'];
    const isAllowed =
      allowedExts.includes(ext) ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv';

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Excel (.xlsx, .xls), and CSV (.csv) files are supported for import'));
    }
  },
});

// Import History
router.get('/import-history', QuantityMasterController.getImportHistory);

// PDF Import & Bulk Extraction Routes
router.post(
  '/import-pdf/parse',
  uploadMemory.single('file'),
  QuantityMasterController.parsePdfImport
);
router.post('/import-pdf/commit', QuantityMasterController.commitPdfImport);

export default router;
