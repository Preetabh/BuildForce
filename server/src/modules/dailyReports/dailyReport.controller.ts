import { Request, Response, NextFunction } from 'express';
import { DailyReportService } from './dailyReport.service';
import { DailyReportFilterQuery } from './dailyReport.types';

export class DailyReportController {
  public static async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const ip = req.ip || req.socket.remoteAddress;
      const report = await DailyReportService.createReport(companyId, req.user!, req.body, ip);
      res.status(201).json({
        success: true,
        message: 'Daily site report submitted successfully',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = req.query as unknown as DailyReportFilterQuery;
      const result = await DailyReportService.getReports(companyId, query, req.user!);
      res.status(200).json({
        success: true,
        data: result.reports,
        pagination: result.pagination,
        stats: result.stats,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const report = await DailyReportService.getReportById(companyId, id, req.user!);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const report = await DailyReportService.updateReport(companyId, id, req.body, req.user!, ip);
      res.status(200).json({
        success: true,
        message: 'Daily site report updated successfully',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async reviewReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const report = await DailyReportService.reviewReport(companyId, id, req.body, req.user!, ip);
      res.status(200).json({
        success: true,
        message: `Report marked as ${req.body.status}`,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMissingReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const missingSites = await DailyReportService.getMissingReports(companyId);
      res.status(200).json({
        success: true,
        data: missingSites,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async uploadFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const singleFile = req.file;

      const uploadedFiles: Array<{ url: string; name: string; size: number; type: string }> = [];

      if (Array.isArray(files)) {
        files.forEach((f) => {
          uploadedFiles.push({
            url: `/uploads/daily-reports/${f.filename}`,
            name: f.originalname,
            size: f.size,
            type: f.mimetype,
          });
        });
      } else if (singleFile) {
        uploadedFiles.push({
          url: `/uploads/daily-reports/${singleFile.filename}`,
          name: singleFile.originalname,
          size: singleFile.size,
          type: singleFile.mimetype,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles,
      });
    } catch (err) {
      next(err);
    }
  }
}
