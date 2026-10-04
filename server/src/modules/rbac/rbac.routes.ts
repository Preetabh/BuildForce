import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createMenuSchema,
  updateMenuSchema,
  createRoleSchema,
  updateRoleSchema,
  updateRolePermissionSchema,
  batchUpdateRolePermissionsSchema,
  updateUserRoleAndPermissionsSchema,
} from './rbac.validation';

const router = Router();

// Protect all RBAC routes
router.use(authenticate);

// Navigation Architecture / Menus
router.get('/menus', RbacController.getMenus);
router.post('/menus', validateBody(createMenuSchema), RbacController.createMenu);
router.put('/menus/:id', validateBody(updateMenuSchema), RbacController.updateMenu);
router.delete('/menus/:id', RbacController.deleteMenu);

// Roles & Permissions (Allow / Decline)
router.get('/roles', RbacController.getRoles);
router.post('/roles', validateBody(createRoleSchema), RbacController.createRole);
router.put('/roles/:id', validateBody(updateRoleSchema), RbacController.updateRole);
router.delete('/roles/:id', RbacController.deleteRole);
router.patch(
  '/roles/:roleId/permission',
  validateBody(updateRolePermissionSchema),
  RbacController.updateRolePermission
);
router.patch(
  '/roles/:roleId/batch-permissions',
  validateBody(batchUpdateRolePermissionsSchema),
  RbacController.batchUpdateRolePermissions
);

// Users & Role Vs User
router.get('/users', RbacController.getUsers);
router.post('/users', RbacController.createUser);
router.put(
  '/users/:userId',
  validateBody(updateUserRoleAndPermissionsSchema),
  RbacController.updateUserRoleAndPermissions
);
router.patch('/users/:userId/toggle-status', RbacController.toggleUserStatus);
router.delete('/users/:userId', RbacController.deleteUser);

export default router;
