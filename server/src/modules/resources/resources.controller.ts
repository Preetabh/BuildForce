import { Request, Response, NextFunction } from 'express';
import { ResourcesService } from './resources.service';

export class ResourcesController {
  // BOM
  public static async getBomItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const items = await ResourcesService.getBomItems(companyId, projectId);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  public static async addBomItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const item = await ResourcesService.addBomItem(companyId, projectId, req.body);
      res.status(201).json({ success: true, message: 'BOM item added', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteBomItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId, id } = req.params;
      const result = await ResourcesService.deleteBomItem(companyId, projectId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Manpower
  public static async getManpowerItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const items = await ResourcesService.getManpowerItems(companyId, projectId);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  public static async addManpowerItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const item = await ResourcesService.addManpowerItem(companyId, projectId, req.body);
      res.status(201).json({ success: true, message: 'Manpower item added', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteManpowerItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId, id } = req.params;
      const result = await ResourcesService.deleteManpowerItem(companyId, projectId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Machinery
  public static async getMachineryItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const items = await ResourcesService.getMachineryItems(companyId, projectId);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  public static async addMachineryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId } = req.params;
      const item = await ResourcesService.addMachineryItem(companyId, projectId, req.body);
      res.status(201).json({ success: true, message: 'Machinery item added', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteMachineryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { projectId, id } = req.params;
      const result = await ResourcesService.deleteMachineryItem(companyId, projectId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Masters
  public static async getMasters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const [materials, labourTypes, machineryTypes] = await Promise.all([
        ResourcesService.getMaterialsMaster(companyId),
        ResourcesService.getLabourTypesMaster(companyId),
        ResourcesService.getMachineryTypesMaster(companyId),
      ]);
      res.status(200).json({
        success: true,
        data: { materials, labourTypes, machineryTypes },
      });
    } catch (error) {
      next(error);
    }
  }
}
