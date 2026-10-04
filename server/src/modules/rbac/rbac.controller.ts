import { Request, Response, NextFunction } from 'express';
import { RbacService } from './rbac.service';

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
      res.status(201).json({ success: true, data: menu });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const menu = await RbacService.updateMenu(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data: menu });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await RbacService.deleteMenu(companyId, req.params.id);
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
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const role = await RbacService.updateRole(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await RbacService.deleteRole(companyId, req.params.id);
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
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const user = await RbacService.createUser(companyId, req.body);
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
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
