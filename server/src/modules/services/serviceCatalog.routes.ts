import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireApiPermission } from '../../middleware/rbac.middleware';
import { ServiceCatalogController } from './serviceCatalog.controller';

const router = Router();

// Apply auth to all service catalog routes
router.use(authenticate);
router.use(requireApiPermission(['Admin/Service', 'Admin/ManageServices', 'Admin/Modules']));

router.get('/', ServiceCatalogController.getServices);
router.post('/', ServiceCatalogController.createService);
router.put('/:id', ServiceCatalogController.updateService);
router.patch('/:id/toggle', ServiceCatalogController.toggleService);
router.delete('/:id', ServiceCatalogController.deleteService);

export default router;
