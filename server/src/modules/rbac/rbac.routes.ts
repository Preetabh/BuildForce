import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireApiPermission } from '../../middleware/rbac.middleware';
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

// Protect all RBAC routes - requires valid token and Settings module access
router.use(authenticate);
router.use(
  requireApiPermission([
    'Admin/Settings',
    'RBAC/ManageMenus',
    'RBAC/ManageRoles',
    'RBAC/UserOverrides',
    'Home/ManageEmployees',
  ])
);

// Navigation Architecture / Menus (Requires Manage Menus permission)
router.get('/menus', RbacController.getMenus);
router.post(
  '/menus',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageMenus']),
  validateBody(createMenuSchema),
  RbacController.createMenu
);
router.put(
  '/menus/:id',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageMenus']),
  validateBody(updateMenuSchema),
  RbacController.updateMenu
);
router.delete(
  '/menus/:id',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageMenus']),
  RbacController.deleteMenu
);

// Roles & Permissions (Requires Manage Roles permission)
router.get('/roles', RbacController.getRoles);
router.post(
  '/roles',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageRoles']),
  validateBody(createRoleSchema),
  RbacController.createRole
);
router.put(
  '/roles/:id',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageRoles']),
  validateBody(updateRoleSchema),
  RbacController.updateRole
);
router.delete(
  '/roles/:id',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageRoles']),
  RbacController.deleteRole
);
router.patch(
  '/roles/:roleId/permission',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageRoles']),
  validateBody(updateRolePermissionSchema),
  RbacController.updateRolePermission
);
router.patch(
  '/roles/:roleId/batch-permissions',
  requireApiPermission(['Admin/Settings', 'RBAC/ManageRoles']),
  validateBody(batchUpdateRolePermissionsSchema),
  RbacController.batchUpdateRolePermissions
);

// Users & Role Vs User (Requires User Management or RoleVsUser permission)
router.get('/users', RbacController.getUsers);
router.post(
  '/users',
  requireApiPermission(['Admin/Settings', 'Home/ManageEmployees']),
  RbacController.createUser
);
router.put(
  '/users/:userId',
  requireApiPermission(['Admin/Settings', 'Home/ManageEmployees', 'RBAC/UserOverrides']),
  validateBody(updateUserRoleAndPermissionsSchema),
  RbacController.updateUserRoleAndPermissions
);
router.patch(
  '/users/:userId/toggle-status',
  requireApiPermission(['Admin/Settings', 'Home/ManageEmployees', 'RBAC/UserOverrides']),
  RbacController.toggleUserStatus
);
router.delete(
  '/users/:userId',
  requireApiPermission(['Admin/Settings', 'Home/ManageEmployees']),
  RbacController.deleteUser
);

export default router;
