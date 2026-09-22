import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
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

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const userPerms = ROLE_PERMISSIONS[userRole] || [];
  if (userPerms.includes('*')) return true;
  if (userPerms.includes(permission)) return true;

  // Wildcard scope check e.g. "boq.*"
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
