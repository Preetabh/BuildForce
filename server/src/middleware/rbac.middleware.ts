import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { RbacRole } from '../models/RbacRole';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
  MASTER_ADMIN: ['*'],
  SITE_ENGINEER: [
    'project.view',
    'measurement.view',
    'measurement.create',
    'measurement.edit',
    'sor.view',
    'boq.view',
  ],
  MANAGER: [
    'project.view',
    'project.create',
    'project.edit',
    'sor.view',
    'sor.import',
    'sor.edit',
    'sor.approve',
    'sor.publish',
    'boq.view',
    'boq.create',
    'boq.edit',
    'boq.approve',
    'measurement.view',
    'measurement.create',
    'measurement.edit',
    'measurement.approve',
    'bom.view',
    'bom.create',
    'bom.edit',
    'manpower.view',
    'manpower.create',
    'manpower.edit',
    'machinery.view',
    'machinery.create',
    'machinery.edit',
    'billing.view',
    'billing.create',
    'billing.edit',
    'billing.submit',
  ],
  USER: [
    'project.view',
    'sor.view',
    'boq.view',
    'boq.create',
    'measurement.view',
    'measurement.create',
    'bom.view',
    'manpower.view',
    'machinery.view',
    'billing.view',
  ],
};

/**
 * Check if a user has a specific permission dynamically
 * 1. Checks user-level custom granular overrides first
 * 2. Checks role-level default permissions from RbacRole in MongoDB
 * 3. Falls back to Master Admin full access
 */
export const checkUserPermission = async (
  userId: string,
  companyId: string,
  userRole: string,
  permissionKey: string | string[]
): Promise<boolean> => {
  const normRole = (userRole || '').trim();

  // 1. Fetch user to check active status and custom granular overrides
  const user = await User.findById(userId).select('role permissions isActive companyId').lean();
  if (!user || user.isActive === false) {
    return false;
  }

  const keysToCheck = Array.isArray(permissionKey) ? permissionKey : [permissionKey];

  // Check user-level custom granular overrides first
  if (user.permissions) {
    const userPermMap: Record<string, any> =
      user.permissions instanceof Map
        ? Object.fromEntries(user.permissions)
        : (user.permissions as any);

    for (const key of keysToCheck) {
      if (typeof userPermMap[key] === 'boolean') {
        return userPermMap[key];
      }
    }
  }

  // 2. Check if user is Master Admin / Super Admin (all permitted by default)
  const isMasterAdmin =
    normRole === 'ADMIN' ||
    normRole === 'MASTER_ADMIN' ||
    normRole.toLowerCase() === 'master admin' ||
    normRole === 'SUPER_ADMIN';

  if (isMasterAdmin) {
    return true;
  }

  // 3. Check role-level permissions from database
  const roleDoc = await RbacRole.findOne({
    companyId,
    $or: [{ code: normRole }, { name: normRole }],
  }).lean();

  if (roleDoc && Array.isArray(roleDoc.permissions)) {
    for (const key of keysToCheck) {
      const match = roleDoc.permissions.find(
        (p) => p.menuRoute === key || p.menuTitle === key
      );
      if (match) {
        return Boolean(match.allow);
      }
    }
  }

  // 4. Fallback check for legacy keys in ROLE_PERMISSIONS
  for (const key of keysToCheck) {
    const legacyPerms = ROLE_PERMISSIONS[normRole] || [];
    if (legacyPerms.includes('*') || legacyPerms.includes(key)) {
      return true;
    }
    const [scope] = key.split('.');
    if (scope && legacyPerms.includes(`${scope}.*`)) {
      return true;
    }
  }

  return false;
};

/**
 * Express middleware to enforce dynamic API permissions
 */
export const requireApiPermission = (permissionKey: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const isAllowed = await checkUserPermission(
        req.user.userId,
        req.user.companyId,
        req.user.role,
        permissionKey
      );

      if (!isAllowed) {
        res.status(403).json({
          success: false,
          message: `Forbidden: You do not possess the required permission [${Array.isArray(permissionKey) ? permissionKey.join(', ') : permissionKey}] to perform this action.`,
          requiredPermission: permissionKey,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Synchronous legacy fallback helper
 */
export const hasPermission = (userRole: string, permission: string): boolean => {
  const normRole = (userRole || '').trim();
  const isMasterAdmin =
    normRole === 'ADMIN' ||
    normRole === 'MASTER_ADMIN' ||
    normRole.toLowerCase() === 'master admin' ||
    normRole === 'SUPER_ADMIN';

  if (isMasterAdmin) return true;

  const userPerms = ROLE_PERMISSIONS[normRole] || [];
  if (userPerms.includes('*')) return true;
  if (userPerms.includes(permission)) return true;

  const [scope] = permission.split('.');
  if (userPerms.includes(`${scope}.*`)) return true;

  return false;
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: You do not possess the required permission [${permission}] to perform this action.`,
      });
      return;
    }

    next();
  };
};
