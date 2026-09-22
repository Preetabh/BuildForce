import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';

export class BillingController {
  public static async getBills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const bills = await BillingService.getBills(companyId, projectId);
      res.status(200).json({ success: true, data: bills });
    } catch (error) {
      next(error);
    }
  }

  public static async generateDraftBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const bill = await BillingService.generateDraftBill(companyId, projectId, userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Running Account (RA) Bill generated from approved measurements',
        data: bill,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async submitBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const bill = await BillingService.submitBill(companyId, projectId, userId, id);
      res.status(200).json({
        success: true,
        message: 'Bill submitted successfully',
        data: bill,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async approveBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const bill = await BillingService.approveBill(companyId, projectId, userId, id);
      res.status(200).json({
        success: true,
        message: 'Bill approved successfully',
        data: bill,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCostControl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const data = await BillingService.getProjectCostControl(companyId, projectId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
