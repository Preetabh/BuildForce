import { Request, Response, NextFunction } from 'express';
import { SiteEngineerService } from './siteEngineer.service';
import { AuditService } from '../audit/audit.service';

export class SiteEngineerController {
  public static async getSiteEngineers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineers = await SiteEngineerService.getSiteEngineers(companyId);
      res.status(200).json({ success: true, data: engineers });
    } catch (err) {
      next(err);
    }
  }

  public static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.getMyEngineerProfile(
        companyId,
        req.user!.userId,
        req.user!.name,
        req.user!.email
      );
      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async getSiteEngineerById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.getSiteEngineerById(companyId, req.params.id);
      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async createSiteEngineer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.createSiteEngineer(companyId, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'SITE_ENGINEERS',
        entity: 'SiteEngineer',
        entityId: (engineer as any)._id?.toString() || req.params.id,
        entityName: engineer.name,
        summary: `Registered Site Engineer "${engineer.name}" (${engineer.mobile || 'No mobile'})`,
        newValue: req.body,
        req,
      });

      res.status(201).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSiteEngineer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.updateSiteEngineer(companyId, req.params.id, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'SITE_ENGINEERS',
        entity: 'SiteEngineer',
        entityId: (engineer as any)._id?.toString() || req.params.id,
        entityName: engineer.name,
        summary: `Updated Site Engineer profile "${engineer.name}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.toggleStatus(companyId, req.params.id);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'STATUS_CHANGE',
        module: 'SITE_ENGINEERS',
        entity: 'SiteEngineer',
        entityId: (engineer as any)._id?.toString() || req.params.id,
        entityName: engineer.name,
        summary: `Site Engineer "${engineer.name}" status changed to ${engineer.status}`,
        newValue: { status: engineer.status },
        req,
      });

      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async updateWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { amount, operation, notes } = req.body;
      const engineer = await SiteEngineerService.updateWallet(companyId, req.params.id, amount, operation, notes);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'SITE_ENGINEERS',
        entity: 'SiteEngineer',
        entityId: (engineer as any)._id?.toString() || req.params.id,
        entityName: engineer.name,
        summary: `Wallet ${operation === 'add' ? 'credited' : 'debited'} ₹${amount} for "${engineer.name}"`,
        severity: 'WARN',
        newValue: { amount, operation, notes, walletBalance: engineer.walletBalance },
        req,
      });

      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSiteEngineer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await SiteEngineerService.deleteSiteEngineer(
        companyId,
        req.params.id,
        req.user?.userId,
        req.user?.name
      );
      res.status(200).json({ success: true, message: 'Engineer moved to Recycle Bin' });
    } catch (err) {
      next(err);
    }
  }
}
