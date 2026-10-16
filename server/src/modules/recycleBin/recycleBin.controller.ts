import { Request, Response, NextFunction } from 'express';
import { RecycleBinService } from './recycleBin.service';

export class RecycleBinController {
  public static async getRecycleBinItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { entityType } = req.query as { entityType?: string };
      const items = await RecycleBinService.getRecycleBinItems(companyId, entityType);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async restoreItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const result = await RecycleBinService.restoreItem(companyId, id, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async permanentDeleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const result = await RecycleBinService.permanentDelete(companyId, id, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
