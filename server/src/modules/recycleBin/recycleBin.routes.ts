import { Router } from 'express';
import { RecycleBinController } from './recycleBin.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Universal Recycle Bin Endpoints
router.get('/', RecycleBinController.getRecycleBinItems);
router.patch('/:id/restore', RecycleBinController.restoreItem);
router.post('/:id/restore', RecycleBinController.restoreItem);
router.delete('/:id/permanent', RecycleBinController.permanentDeleteItem);

export default router;
