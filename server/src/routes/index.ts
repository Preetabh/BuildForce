import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import projectRoutes from '../modules/projects/project.routes';
import sorRoutes from '../modules/sor/sor.routes';
import boqRoutes from '../modules/boq/boq.routes';
import measurementRoutes from '../modules/measurements/measurement.routes';
import resourcesRoutes from '../modules/resources/resources.routes';
import billingRoutes from '../modules/billing/billing.routes';
import quantityMasterRoutes from '../modules/quantityMaster/quantityMaster.routes';
import leadRoutes from '../modules/leads/lead.routes';
import { authenticate } from '../middleware/auth.middleware';
import { AuditService } from '../modules/audit/audit.service';

const router = Router();

// Public Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'InfraPilot Construction ERP Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth Routes
router.use('/auth', authRoutes);

// SOR & Rate Master Routes
router.use('/sor', sorRoutes);

// Quantity Master Catalog Routes
router.use('/quantity-master', quantityMasterRoutes);

// Project Routes
router.use('/projects', projectRoutes);

// Project Child Modules
router.use('/projects/:projectId/boq', boqRoutes);
router.use('/projects/:projectId/measurements', measurementRoutes);
router.use('/projects/:projectId/resources', resourcesRoutes);
router.use('/projects/:projectId/billing', billingRoutes);

// Lead Management Routes
router.use('/leads', leadRoutes);

// Service Catalog Routes
import serviceCatalogRoutes from '../modules/services/serviceCatalog.routes';
router.use('/services', serviceCatalogRoutes);

// RBAC Role Admin Section Routes (Manage Menus, Manage Roles, Role Vs User, Users)
import rbacRoutes from '../modules/rbac/rbac.routes';
router.use('/rbac', rbacRoutes);

// Site Engineer Routes (Detailed Site Engineers, Add Site Engineer, Status Allow/Decline, Wallet)
import siteEngineerRoutes from '../modules/siteEngineers/siteEngineer.routes';
router.use('/site-engineers', siteEngineerRoutes);

// Vendor & Worker Routes
import vendorRoutes from '../modules/vendors/vendor.routes';
router.use('/', vendorRoutes);

// Audit Trail Routes
router.get('/audit/recent', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await AuditService.getRecentLogs(companyId, limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

router.get('/audit/:entity/:entityId', authenticate, async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;
    const companyId = req.user!.companyId;
    const logs = await AuditService.getLogsForEntity(companyId, entity, entityId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

export default router;
