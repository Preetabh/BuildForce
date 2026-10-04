import { Router } from 'express';
import { SiteEngineerController } from './siteEngineer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createSiteEngineerSchema,
  updateSiteEngineerSchema,
  updateWalletSchema,
} from './siteEngineer.validation';

const router = Router();

router.use(authenticate);

router.get('/', SiteEngineerController.getSiteEngineers);
router.post('/', validateBody(createSiteEngineerSchema), SiteEngineerController.createSiteEngineer);
router.put('/:id', validateBody(updateSiteEngineerSchema), SiteEngineerController.updateSiteEngineer);
router.patch('/:id/toggle-status', SiteEngineerController.toggleStatus); // Allow / Decline
router.patch('/:id/wallet', validateBody(updateWalletSchema), SiteEngineerController.updateWallet);
router.delete('/:id', SiteEngineerController.deleteSiteEngineer);

export default router;
