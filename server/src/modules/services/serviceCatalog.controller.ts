import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ServiceCatalog } from '../../models/ServiceCatalog';

export const DEFAULT_SERVICES = [
  'Floor Plan Design',
  'Floor Plan Full Design',
  'Elevation Design',
  'Interior Full Design',
  'Construction Structure',
  'Construction Furnished',
  'Renovation',
  'Interior Work',
  'Modular Kitchen Work',
  'Furniture Work',
];

export class ServiceCatalogController {
  /**
   * Get all services for the company.
   * If company has no services seeded yet, automatically seed the 10 standard services from Screenshot 1!
   */
  static async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId || (req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required' });
      }

      const compId = new mongoose.Types.ObjectId(companyId);
      const activeOnly = req.query.activeOnly === 'true' || req.query.activeOnly === '1';

      let count = await ServiceCatalog.countDocuments({ companyId: compId });
      if (count === 0) {
        // Seed default 10 services
        const seedDocs = DEFAULT_SERVICES.map((name, index) => ({
          companyId: compId,
          name,
          isActive: true,
          sortOrder: index + 1,
        }));
        await ServiceCatalog.insertMany(seedDocs);
      }

      const query: any = { companyId: compId };
      if (activeOnly) {
        query.isActive = true;
      }

      const services = await ServiceCatalog.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();
      return res.status(200).json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new service category
   */
  static async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required' });
      }

      const { name, description, isActive } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Service name is required' });
      }

      const compId = new mongoose.Types.ObjectId(companyId);

      // Check if already exists
      const existing = await ServiceCatalog.findOne({
        companyId: compId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'A service with this name already exists' });
      }

      const count = await ServiceCatalog.countDocuments({ companyId: compId });

      const newService = new ServiceCatalog({
        companyId: compId,
        name: name.trim(),
        description: description?.trim() || '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: count + 1,
      });

      await newService.save();
      return res.status(201).json({ success: true, message: 'Service created successfully', data: newService });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update service
   */
  static async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const { name, description, isActive, sortOrder } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

      const query: any = { _id: new mongoose.Types.ObjectId(id) };
      if (companyId) {
        query.companyId = new mongoose.Types.ObjectId(companyId);
      }

      const updated = await ServiceCatalog.findOneAndUpdate(query, { $set: updateData }, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      return res.status(200).json({ success: true, message: 'Service updated successfully', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle service active status
      */
      static async toggleService(req: Request, res: Response, next: NextFunction) {
        try {
      const companyId = req.user?.companyId;
      const { id } = req.params;

      const query: any = { _id: new mongoose.Types.ObjectId(id) };
      if (companyId) {
        query.companyId = new mongoose.Types.ObjectId(companyId);
      }

      const service = await ServiceCatalog.findOne(query);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      service.isActive = !service.isActive;
      await service.save();

      return res.status(200).json({
        success: true,
        message: `Service marked as ${service.isActive ? 'Active' : 'Inactive'}`,
        data: service,
      });
    } catch (error) {               
      next(error);
    }
  }

  /**
   * Delete service
   */
  static async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;

      const query: any = { _id: new mongoose.Types.ObjectId(id) };
      if (companyId) {
        query.companyId = new mongoose.Types.ObjectId(companyId);
      }

      const deleted = await ServiceCatalog.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      return res.status(200).json({ success: true, message: 'Service removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
