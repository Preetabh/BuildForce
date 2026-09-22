import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Running Bills
router.get('/', requirePermission('billing.view'), BillingController.getBills);
router.post('/', requirePermission('billing.create'), BillingController.generateDraftBill);
router.patch('/:id/submit', requirePermission('billing.submit'), BillingController.submitBill);
router.patch('/:id/approve', requirePermission('billing.approve'), BillingController.approveBill);

// Project Cost Control
router.get('/cost-control', requirePermission('project.view'), BillingController.getCostControl);

export default router;
