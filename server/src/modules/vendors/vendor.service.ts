import mongoose, { Types } from 'mongoose';
import { Vendor, IVendor } from '../../models/Vendor';
import { Worker, IWorker } from '../../models/Worker';
import { AppError } from '../../middleware/error.middleware';

export class VendorService {
  /**
   * Get all vendors for a company purely from MongoDB (NO hardcoded seeds)
   */
  public static async getVendors(
    companyIdInput: string | Types.ObjectId,
    filters?: {
      search?: string;
      type?: string;
      status?: string;
    }
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const query: any = { companyId };

    if (filters?.type && filters.type !== 'All Types' && filters.type !== 'all') {
      query.type = filters.type;
    }

    if (filters?.status && filters.status !== 'All' && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { name: regex },
        { contactPhone: regex },
        { alternatePhone: regex },
        { contactEmail: regex },
        { location: regex },
        { city: regex },
        { state: regex },
        { fullAddress: regex },
        { supplies: regex },
        { gstNumber: regex },
      ];
    }

    const vendors = await Vendor.find(query).sort({ createdAt: -1 }).lean();
    return vendors;
  }

  public static async createVendor(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const location =
      data.location?.trim() ||
      [data.city?.trim(), data.state?.trim()].filter(Boolean).join(', ') ||
      data.fullAddress?.trim() ||
      '';

    const vendor = new Vendor({
      ...data,
      location,
      companyId,
    });
    await vendor.save();
    return vendor;
  }

  public static async updateVendor(
    companyIdInput: string | Types.ObjectId,
    vendorId: string,
    data: any
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const vendor = await Vendor.findOneAndUpdate(
      { _id: vendorId, companyId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }
    return vendor;
  }

  public static async toggleVendorStatus(
    companyIdInput: string | Types.ObjectId,
    vendorId: string
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const vendor = await Vendor.findOne({ _id: vendorId, companyId });
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    vendor.status = vendor.status === 'Active' ? 'Inactive' : 'Active';
    await vendor.save();
    return vendor;
  }

  public static async deleteVendor(
    companyIdInput: string | Types.ObjectId,
    vendorId: string
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const result = await Vendor.findOneAndDelete({ _id: vendorId, companyId });
    if (!result) {
      throw new AppError('Vendor not found', 404);
    }
    return { success: true, message: 'Vendor removed successfully' };
  }

  /**
   * WORKER OPERATIONS - Pure DB only (NO hardcoded seeds)
   */
  public static async getWorkers(
    companyIdInput: string | Types.ObjectId,
    filters?: {
      search?: string;
      trade?: string;
      status?: string;
    }
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const query: any = { companyId };

    if (filters?.trade && filters.trade !== 'All Trades' && filters.trade !== 'all') {
      query.trade = filters.trade;
    }

    if (filters?.status && filters.status !== 'All' && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { name: regex },
        { contactPhone: regex },
        { alternatePhone: regex },
        { contactEmail: regex },
        { location: regex },
        { city: regex },
        { state: regex },
        { permanentAddress: regex },
        { specialSkills: regex },
        { trade: regex },
      ];
    }

    const workers = await Worker.find(query).sort({ createdAt: -1 }).lean();
    return workers;
  }

  public static async createWorker(companyIdInput: string | Types.ObjectId, data: any) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const location =
      data.location?.trim() ||
      [data.city?.trim(), data.state?.trim()].filter(Boolean).join(', ') ||
      data.permanentAddress?.trim() ||
      '';

    const worker = new Worker({
      ...data,
      location,
      companyId,
    });
    await worker.save();
    return worker;
  }

  public static async updateWorker(
    companyIdInput: string | Types.ObjectId,
    workerId: string,
    data: any
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    if (!data.location && (data.city || data.state || data.permanentAddress)) {
      data.location =
        [data.city?.trim(), data.state?.trim()].filter(Boolean).join(', ') ||
        data.permanentAddress?.trim() ||
        '';
    }

    const worker = await Worker.findOneAndUpdate(
      { _id: workerId, companyId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }
    return worker;
  }

  public static async toggleWorkerStatus(
    companyIdInput: string | Types.ObjectId,
    workerId: string
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const worker = await Worker.findOne({ _id: workerId, companyId });
    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    worker.status = worker.status === 'Active' ? 'Inactive' : 'Active';
    await worker.save();
    return worker;
  }

  public static async deleteWorker(
    companyIdInput: string | Types.ObjectId,
    workerId: string
  ) {
    const companyId =
      typeof companyIdInput === 'string'
        ? new mongoose.Types.ObjectId(companyIdInput)
        : companyIdInput;

    const result = await Worker.findOneAndDelete({ _id: workerId, companyId });
    if (!result) {
      throw new AppError('Worker not found', 404);
    }
    return { success: true, message: 'Worker removed successfully' };
  }
}
