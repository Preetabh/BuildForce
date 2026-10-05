import { Request, Response, NextFunction } from 'express';
import { VendorService } from './vendor.service';

export class VendorController {
  // --- Vendors ---
  public static async getVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { search, type, status } = req.query;
      const vendors = await VendorService.getVendors(companyId, {
        search: search as string,
        type: type as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data: vendors });
    } catch (err) {
      next(err);
    }
  }

  public static async createVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const vendor = await VendorService.createVendor(companyId, req.body);
      res.status(201).json({ success: true, data: vendor, message: 'Vendor added successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const vendor = await VendorService.updateVendor(companyId, id, req.body);
      res.status(200).json({ success: true, data: vendor, message: 'Vendor updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleVendorStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const vendor = await VendorService.toggleVendorStatus(companyId, id);
      res.status(200).json({ success: true, data: vendor, message: `Vendor status changed to ${vendor.status}` });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const result = await VendorService.deleteVendor(companyId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // --- Workers ---
  public static async getWorkers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { search, trade, status } = req.query;
      const workers = await VendorService.getWorkers(companyId, {
        search: search as string,
        trade: trade as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data: workers });
    } catch (err) {
      next(err);
    }
  }

  public static async createWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const worker = await VendorService.createWorker(companyId, req.body);
      res.status(201).json({ success: true, data: worker, message: 'Worker registered successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async updateWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const worker = await VendorService.updateWorker(companyId, id, req.body);
      res.status(200).json({ success: true, data: worker, message: 'Worker details updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleWorkerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const worker = await VendorService.toggleWorkerStatus(companyId, id);
      res.status(200).json({ success: true, data: worker, message: `Worker status changed to ${worker.status}` });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { id } = req.params;
      const result = await VendorService.deleteWorker(companyId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
