import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

// Aggregated stats & analytics
router.get('/stats', AuditController.getStats);

// Export logs to CSV/JSON
router.get('/export', AuditController.exportLogs);

// User-specific activity log (supports 'me' or specific user ID)
router.get('/user/:userId', AuditController.getUserLogs);

// Entity-specific audit log (Vendors, Projects, Roles, Leads, etc.)
router.get('/entity/:entity/:entityId', AuditController.getEntityLogs);

// Enterprise log search & server-side pagination (root query & /logs alias)
router.get('/', AuditController.getLogs);
router.get('/logs', AuditController.getLogs);

// Single log detail with before/after diff & related items
router.get('/:id', AuditController.getLogById);

export default router;
