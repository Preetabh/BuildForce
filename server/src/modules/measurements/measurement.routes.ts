import { Router } from 'express';
import { MeasurementController } from './measurement.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/summary', requirePermission('measurement.view'), MeasurementController.getMeasurementSummary);
router.get('/', requirePermission('measurement.view'), MeasurementController.getMeasurements);
router.post('/preview', requirePermission('measurement.view'), MeasurementController.previewMeasurement);
router.post('/', requirePermission('measurement.create'), MeasurementController.addMeasurement);
router.put('/:id', requirePermission('measurement.edit'), MeasurementController.updateMeasurement);
router.post('/:id/duplicate', requirePermission('measurement.create'), MeasurementController.duplicateMeasurement);
router.patch('/:id/approve', requirePermission('measurement.approve'), MeasurementController.approveMeasurement);
router.patch('/:id/reverse', requirePermission('measurement.edit'), MeasurementController.reverseMeasurement);
router.delete('/:id', requirePermission('measurement.delete'), MeasurementController.deleteMeasurement);

export default router;
