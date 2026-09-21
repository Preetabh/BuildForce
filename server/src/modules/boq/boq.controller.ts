import { Request, Response, NextFunction } from 'express';
import { BoqService } from './boq.service';

export class BoqController {
  public static async getBoq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const result = await BoqService.getBoqItems(companyId, projectId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addBoqItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const item = await BoqService.addBoqItem(companyId, projectId, userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Item added to BOQ successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateBoqItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, itemId } = req.params;
      const updated = await BoqService.updateBoqItem(companyId, projectId, userId, itemId, req.body);
      res.status(200).json({
        success: true,
        message: 'BOQ item updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteBoqItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, itemId } = req.params;
      const result = await BoqService.deleteBoqItem(companyId, projectId, userId, itemId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async approveBoq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, boqId } = req.params;
      const approved = await BoqService.approveBoq(companyId, projectId, userId, boqId);
      res.status(200).json({
        success: true,
        message: 'BOQ approved successfully',
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getItemRateAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId, itemId } = req.params;
      const result = await BoqService.getItemRateAnalysis(companyId, projectId, itemId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async saveItemRateAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, itemId } = req.params;
      const result = await BoqService.saveItemRateAnalysis(companyId, projectId, userId, itemId, req.body);
      res.status(200).json({
        success: true,
        message: 'Rate analysis composition configured and downstream execution updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
