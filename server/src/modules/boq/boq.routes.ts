import { Router } from 'express';
import { BoqController } from './boq.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', requirePermission('boq.view'), BoqController.getBoq);
router.post('/items', requirePermission('boq.create'), BoqController.addBoqItem);
router.patch('/items/:itemId', requirePermission('boq.edit'), BoqController.updateBoqItem);
router.delete('/items/:itemId', requirePermission('boq.delete'), BoqController.deleteBoqItem);
router.get('/items/:itemId/rate-analysis', requirePermission('boq.view'), BoqController.getItemRateAnalysis);
router.post('/items/:itemId/rate-analysis', requirePermission('boq.edit'), BoqController.saveItemRateAnalysis);
router.post('/:boqId/approve', requirePermission('boq.approve'), BoqController.approveBoq);

export default router;
