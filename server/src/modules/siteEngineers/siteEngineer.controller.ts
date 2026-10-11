import { Request, Response, NextFunction } from 'express';
import { SiteEngineerService } from './siteEngineer.service';

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
      res.status(201).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSiteEngineer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.updateSiteEngineer(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const engineer = await SiteEngineerService.toggleStatus(companyId, req.params.id);
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
      res.status(200).json({ success: true, data: engineer });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSiteEngineer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await SiteEngineerService.deleteSiteEngineer(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Engineer deleted' });
    } catch (err) {
      next(err);
    }
  }
}
