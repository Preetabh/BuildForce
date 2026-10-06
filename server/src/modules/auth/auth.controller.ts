import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';

export class AuthController {
  public static async getSetupStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.getSetupStatus();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async registerAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerAdmin(req.body, req);
      res.status(201).json({
        success: true,
        message: 'Administrator account registered successfully with Master Key',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req);
      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await AuditService.log({
          companyId: req.user.companyId,
          userId: req.user.userId,
          action: 'LOGOUT',
          module: 'AUTH',
          entity: 'User',
          entityId: req.user.userId,
          entityName: req.user.name,
          summary: `User ${req.user.name} signed out`,
          severity: 'INFO',
          status: 'SUCCESS',
          req,
        });
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await AuthService.getCurrentUser(req.user.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await AuthService.updateProfile(req.user.userId, req.body, req);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
