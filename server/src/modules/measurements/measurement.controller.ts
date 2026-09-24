import { Request, Response, NextFunction } from 'express';
import { MeasurementService } from './measurement.service';

export class MeasurementController {
  public static async getMeasurements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const boqItemId = req.query.boqItemId as string;
      const result = await MeasurementService.getMeasurements(companyId, projectId, boqItemId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMeasurementSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const summary = await MeasurementService.getMeasurementSummary(companyId, projectId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async previewMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const preview = await MeasurementService.getMeasurementPreview(companyId, projectId, req.body);
      res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const measurement = await MeasurementService.addMeasurementEntry(companyId, projectId, userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Measurement recorded and project totals updated successfully',
        data: measurement,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const measurement = await MeasurementService.updateMeasurement(companyId, projectId, userId, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Measurement updated and all dependent records recalculated',
        data: measurement,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async duplicateMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const duplicate = await MeasurementService.duplicateMeasurement(companyId, projectId, userId, id);
      res.status(201).json({
        success: true,
        message: 'Measurement duplicated successfully',
        data: duplicate,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async approveMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const approved = await MeasurementService.approveMeasurement(companyId, projectId, userId, id);
      res.status(200).json({
        success: true,
        message: 'Measurement approved successfully',
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reverseMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const { reason } = req.body;
      const reversed = await MeasurementService.reverseMeasurement(companyId, projectId, userId, id, reason);
      res.status(200).json({
        success: true,
        message: 'Measurement reversed successfully and downstream resources recalculated',
        data: reversed,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { projectId, id } = req.params;
      const result = await MeasurementService.deleteMeasurement(companyId, projectId, userId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
