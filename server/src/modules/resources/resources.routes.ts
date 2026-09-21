import { Router } from 'express';
import { ResourcesController } from './resources.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// BOM
router.get('/bom', requirePermission('bom.view'), ResourcesController.getBomItems);
router.post('/bom', requirePermission('bom.create'), ResourcesController.addBomItem);
router.delete('/bom/:id', requirePermission('bom.edit'), ResourcesController.deleteBomItem);

// Manpower
router.get('/manpower', requirePermission('manpower.view'), ResourcesController.getManpowerItems);
router.post('/manpower', requirePermission('manpower.create'), ResourcesController.addManpowerItem);
router.delete('/manpower/:id', requirePermission('manpower.edit'), ResourcesController.deleteManpowerItem);

// Machinery
router.get('/machinery', requirePermission('machinery.view'), ResourcesController.getMachineryItems);
router.post('/machinery', requirePermission('machinery.create'), ResourcesController.addMachineryItem);
router.delete('/machinery/:id', requirePermission('machinery.edit'), ResourcesController.deleteMachineryItem);

// Masters lookup
router.get('/masters', ResourcesController.getMasters);

export default router;
