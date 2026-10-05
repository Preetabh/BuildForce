import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Vendors
router.get('/vendors', VendorController.getVendors);
router.post('/vendors', VendorController.createVendor);
router.put('/vendors/:id', VendorController.updateVendor);
router.patch('/vendors/:id/status', VendorController.toggleVendorStatus);
router.delete('/vendors/:id', VendorController.deleteVendor);

// Workers
router.get('/workers', VendorController.getWorkers);
router.post('/workers', VendorController.createWorker);
router.put('/workers/:id', VendorController.updateWorker);
router.patch('/workers/:id/status', VendorController.toggleWorkerStatus);
router.delete('/workers/:id', VendorController.deleteWorker);

export default router;
