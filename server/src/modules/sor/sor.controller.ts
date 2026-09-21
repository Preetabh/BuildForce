import { Request, Response, NextFunction } from 'express';
import { SorService } from './sor.service';
import { AppError } from '../../middleware/error.middleware';

export class SorController {
  /**
   * System-wide shared configuration (file limits, allowed extensions)
   */
  public static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = SorService.getConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fast upload endpoint: accepts up to 250MB via disk streaming, checks duplicate,
   * creates import record, kicks off async batch processing, and responds HTTP 202 immediately.
   */
  public static async uploadImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('Please provide a valid PDF or Excel/CSV file to import', 400);
      }

      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { authority, scheduleName, version, effectiveDate, forceReimport } = req.body;

      if (!authority || !scheduleName || !version) {
        throw new AppError('Authority, Schedule Name, and Version are required fields', 400);
      }

      const result = await SorService.initiateImport(companyId, userId, req.file, {
        authority,
        scheduleName,
        version,
        effectiveDate,
        forceReimport,
      });

      res.status(202).json({
        success: true,
        message: 'File uploaded successfully. Background processing started.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fast polling endpoint to track async processing progress
   */
  public static async getImportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId } = req.params;
      const result = await SorService.getImportStatus(companyId, importId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Paginated retrieval of staged items for administrative review
   */
  public static async getStagedRows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId } = req.params;
      const { page, limit, status, search } = req.query;

      const result = await SorService.getStagedRows(companyId, importId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: (status as any) || undefined,
        search: (search as string) || undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inline update of a single staged row during review
   */
  public static async updateStagedRow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId, rowId } = req.params;
      const updatedRow = await SorService.updateStagedRow(companyId, importId, rowId, req.body);
      res.status(200).json({
        success: true,
        message: 'Staged row updated successfully',
        data: updatedRow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk approve staged rows
   */
  public static async bulkApproveStagedRows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId } = req.params;
      const { rowIds } = req.body;
      const result = await SorService.bulkApproveStagedRows(companyId, importId, rowIds);
      res.status(200).json({
        success: true,
        message: 'Staged items approved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed batch without re-parsing entire document
   */
  public static async retryBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId, batchNumber } = req.params;
      const result = await SorService.retryBatch(companyId, importId, Number(batchNumber));
      res.status(200).json({
        success: true,
        message: `Batch ${batchNumber} queued for retry`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish approved staged rows to active Rate Master
   */
  public static async publishImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { importId } = req.params;
      const result = await SorService.publishImport(companyId, userId, importId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Import History
   */
  public static async listImports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await SorService.listImports(companyId, page, limit);
      res.status(200).json({
        success: true,
        data: result.imports,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an import session
   */
  public static async deleteImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId } = req.params;
      const result = await SorService.deleteImport(companyId, importId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject / clear all previous import sessions and staged data for the company
   */
  public static async rejectAllImports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const result = await SorService.rejectAllImports(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Legacy / single import fetch
   */
  public static async getImportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { importId } = req.params;
      const result = await SorService.getImportById(companyId, importId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search Rate Master (SorItems)
   */
  public static async getSorItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { search, sorId, chapter, unit, minRate, maxRate, page, limit } = req.query;

      const result = await SorService.getSorItems(companyId, {
        search: search as string,
        sorId: sorId as string,
        chapter: chapter as string,
        unit: unit as string,
        minRate: minRate ? Number(minRate) : undefined,
        maxRate: maxRate ? Number(maxRate) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all published SOR Schedules & Versions for company
   */
  public static async getSorMasters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const masters = await SorService.getSorMasters(companyId);
      res.status(200).json({
        success: true,
        data: masters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Smart Search for DSR/SOR items across master schedules with formula and rate analysis
   */
  public static async smartSearchSorItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { search, sorId, authority, chapter, page, limit } = req.query;

      const result = await SorService.smartSearchSorItems(companyId, {
        search: search as string,
        sorId: sorId as string,
        authority: authority as string,
        chapter: chapter as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return active Schedule hierarchy (Department -> Schedule Type -> Version -> Authority)
   */
  public static async getScheduleHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const hierarchy = await SorService.getScheduleHierarchy(companyId);
      res.status(200).json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export SOR schedule items as clean Excel spreadsheet
   */
  public static async exportSor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { sorId } = req.query;

      const { buffer, fileName } = await SorService.exportSorItems(companyId, sorId as string);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a published SOR master schedule and all its items
   */
  public static async deleteSorMaster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { masterId } = req.params;

      const result = await SorService.deleteSorMaster(companyId, masterId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

