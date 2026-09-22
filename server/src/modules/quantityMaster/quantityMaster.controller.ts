import { Request, Response, NextFunction } from 'express';
import { QuantityMasterService } from './quantityMaster.service';

export class QuantityMasterController {
  // Materials
  public static async getMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getMaterials(companyId, req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.createMaterial(companyId, req.body);
      res.status(201).json({ success: true, data, message: 'Material created successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.updateMaterial(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Material updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleMaterialArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.toggleMaterialArchive(companyId, req.params.id);
      res.status(200).json({
        success: true,
        data,
        message: `Material status changed to ${data.status}`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.deleteMaterial(companyId, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Manpower
  public static async getManpower(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getManpower(companyId, req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createManpower(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.createManpower(companyId, req.body);
      res.status(201).json({ success: true, data, message: 'Manpower trade created successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateManpower(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.updateManpower(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Manpower trade updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleManpowerArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.toggleManpowerArchive(companyId, req.params.id);
      res.status(200).json({
        success: true,
        data,
        message: `Manpower trade status changed to ${data.status}`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteManpower(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.deleteManpower(companyId, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Machinery
  public static async getMachinery(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getMachinery(companyId, req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createMachinery(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.createMachinery(companyId, req.body);
      res.status(201).json({ success: true, data, message: 'Machinery created successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMachinery(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.updateMachinery(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Machinery updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleMachineryArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.toggleMachineryArchive(companyId, req.params.id);
      res.status(200).json({
        success: true,
        data,
        message: `Machinery status changed to ${data.status}`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteMachinery(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.deleteMachinery(companyId, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Formulas
  public static async getFormulas(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getFormulas(companyId, req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.createFormula(companyId, req.body);
      res.status(201).json({ success: true, data, message: 'Formula created successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.updateFormula(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Formula updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async copyFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.copyFormula(companyId, req.params.id);
      res.status(201).json({ success: true, data, message: 'Formula duplicated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.deleteFormula(companyId, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Rate Lists
  public static async getRateLists(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getRateLists(companyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createRateList(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.createRateList(companyId, req.body);
      res.status(201).json({ success: true, data, message: 'Rate list created successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async getRateListById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getRateListById(companyId, req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRateListOverrides(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.updateRateListOverrides(
        companyId,
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, data, message: 'Rate list overrides updated' });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteRateList(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.deleteRateList(companyId, req.params.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Import History
  public static async getImportHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const data = await QuantityMasterService.getImportHistory(companyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // PDF / Excel / CSV Bulk Extraction
  public static async parsePdfImport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: 'Please upload a valid document (PDF, Excel, or CSV)' });
      }

      const type = (req.body.type || req.query.type || 'materials') as any;
      const fileName = req.file.originalname || 'document.pdf';
      const { QuantityMasterPdfService } = await import('./quantityMasterPdf.service');
      const result = await QuantityMasterPdfService.parseMasterFile(req.file.buffer, fileName, type);

      res.status(200).json({
        success: true,
        data: result,
        message: `Extracted ${result.totalDetected} items (${result.validCount} valid) from ${fileName}`,
      });
    } catch (err) {
      next(err);
    }
  }

  // PDF Bulk Ingestion Commit
  public static async commitPdfImport(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { type, items, fileName } = req.body;

      const { QuantityMasterPdfService } = await import('./quantityMasterPdf.service');
      const result = await QuantityMasterPdfService.bulkCommitMaster(
        companyId,
        userId,
        type,
        items,
        fileName
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}
