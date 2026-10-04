import { Router } from 'express';
import { SiteEngineerController } from './siteEngineer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireApiPermission } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createSiteEngineerSchema,
  updateSiteEngineerSchema,
  updateWalletSchema,
} from './siteEngineer.validation';

const router = Router();

router.use(authenticate);
router.use(requireApiPermission(['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']));

router.get('/', SiteEngineerController.getSiteEngineers);
router.post(
  '/',
  requireApiPermission(['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']),
  validateBody(createSiteEngineerSchema),
  SiteEngineerController.createSiteEngineer
);
router.put(
  '/:id',
  requireApiPermission(['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']),
  validateBody(updateSiteEngineerSchema),
  SiteEngineerController.updateSiteEngineer
);
router.patch('/:id/toggle-status', SiteEngineerController.toggleStatus); // Allow / Decline
router.patch('/:id/wallet', validateBody(updateWalletSchema), SiteEngineerController.updateWallet);
router.delete(
  '/:id',
  requireApiPermission(['Admin/SiteEngineersSection', 'Admin/ManageSiteEngineers']),
  SiteEngineerController.deleteSiteEngineer
);

export default router;
