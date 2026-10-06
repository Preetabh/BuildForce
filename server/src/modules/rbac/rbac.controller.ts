import { Request, Response, NextFunction } from 'express';
import { RbacService } from './rbac.service';
import { AuditService } from '../audit/audit.service';

export class RbacController {
  // Menus
  public static async getMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const menus = await RbacService.getMenus(companyId);
      res.status(200).json({ success: true, data: menus });
    } catch (err) {
      next(err);
    }
  }

  public static async createMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const menu = await RbacService.createMenu(companyId, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'ROLES',
        entity: 'Menu',
        entityId: (menu as any)._id?.toString() || 'menu',
        entityName: (menu as any).title,
        summary: `Created system menu "${(menu as any).title}"`,
        newValue: req.body,
        severity: 'INFO',
        req,
      });
      res.status(201).json({ success: true, data: menu });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const menu = await RbacService.updateMenu(companyId, req.params.id, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'UPDATE',
        module: 'ROLES',
        entity: 'Menu',
        entityId: req.params.id,
        entityName: (menu as any)?.title || req.params.id,
        summary: `Updated system menu "${(menu as any)?.title || req.params.id}"`,
        newValue: req.body,
        severity: 'INFO',
        req,
      });
      res.status(200).json({ success: true, data: menu });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await RbacService.deleteMenu(companyId, req.params.id);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'DELETE',
        module: 'ROLES',
        entity: 'Menu',
        entityId: req.params.id,
        summary: `Deleted system menu #${req.params.id}`,
        severity: 'WARN',
        req,
      });
      res.status(200).json({ success: true, message: 'Menu deleted' });
    } catch (err) {
      next(err);
    }
  }

  // Roles
  public static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const roles = await RbacService.getRoles(companyId);
      res.status(200).json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  public static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const role = await RbacService.createRole(companyId, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'ROLES',
        entity: 'Role',
        entityId: (role as any)._id?.toString() || 'role',
        entityName: (role as any).name,
        summary: `Created new RBAC role "${(role as any).name}"`,
        newValue: req.body,
        severity: 'SECURITY',
        req,
      });
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const role = await RbacService.updateRole(companyId, req.params.id, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'UPDATE',
        module: 'ROLES',
        entity: 'Role',
        entityId: req.params.id,
        entityName: (role as any)?.name || req.params.id,
        summary: `Updated RBAC role "${(role as any)?.name || req.params.id}"`,
        newValue: req.body,
        severity: 'SECURITY',
        req,
      });
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await RbacService.deleteRole(companyId, req.params.id);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'DELETE',
        module: 'ROLES',
        entity: 'Role',
        entityId: req.params.id,
        summary: `Deleted RBAC role #${req.params.id}`,
        severity: 'SECURITY',
        req,
      });
      res.status(200).json({ success: true, message: 'Role deleted' });
    } catch (err) {
      next(err);
    }
  }

  // Allow / Decline permission toggle
  public static async updateRolePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { roleId } = req.params;
      const { menuRoute, allow } = req.body;
      const role = await RbacService.updateRolePermission(companyId, roleId, menuRoute, allow);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'PERMISSION_CHANGE',
        module: 'ROLES',
        entity: 'Role',
        entityId: roleId,
        entityName: (role as any)?.name || roleId,
        summary: `${allow ? 'Granted' : 'Revoked'} permission "${menuRoute}" for role "${(role as any)?.name || roleId}"`,
        newValue: { menuRoute, allow },
        severity: 'SECURITY',
        req,
      });
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  public static async batchUpdateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { roleId } = req.params;
      const role = await RbacService.batchUpdateRolePermissions(companyId, roleId, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'PERMISSION_CHANGE',
        module: 'ROLES',
        entity: 'Role',
        entityId: roleId,
        entityName: (role as any)?.name || roleId,
        summary: `Batch updated permissions for role "${(role as any)?.name || roleId}"`,
        newValue: req.body,
        severity: 'SECURITY',
        req,
      });
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  // Users & Role Vs User
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const users = await RbacService.getUsers(companyId);
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserRoleAndPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { userId } = req.params;
      const user = await RbacService.updateUserRoleAndPermissions(companyId, userId, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'ROLE_CHANGE',
        module: 'USERS',
        entity: 'User',
        entityId: userId,
        entityName: (user as any)?.name || userId,
        summary: `Changed role & permissions for user ${(user as any)?.name || userId} to role "${req.body.role || (user as any)?.role}"`,
        newValue: req.body,
        severity: 'SECURITY',
        req,
      });
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { userId } = req.params;
      const result = await RbacService.toggleUserStatus(companyId, userId);
      const targetUser = (result as any)?.user || result;
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'STATUS_CHANGE',
        module: 'USERS',
        entity: 'User',
        entityId: userId,
        entityName: targetUser?.name || userId,
        summary: `Changed active status of user ${targetUser?.name || userId} to ${targetUser?.isActive ? 'ACTIVE' : 'DEACTIVATED'}`,
        newValue: { isActive: targetUser?.isActive },
        severity: 'WARN',
        req,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const user = await RbacService.createUser(companyId, req.body);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'USERS',
        entity: 'User',
        entityId: (user as any)._id?.toString() || 'user',
        entityName: (user as any).name,
        summary: `Created user account for ${(user as any).name} (${(user as any).email}) with role ${(user as any).role}`,
        newValue: { name: (user as any).name, email: (user as any).email, role: (user as any).role },
        severity: 'INFO',
        req,
      });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { userId } = req.params;
      const result = await RbacService.deleteUser(companyId, userId);
      await AuditService.log({
        companyId,
        userId: req.user!.userId,
        action: 'DELETE',
        module: 'USERS',
        entity: 'User',
        entityId: userId,
        summary: `Deleted user account #${userId}`,
        severity: 'WARN',
        req,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
