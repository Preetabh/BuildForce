import { Types } from 'mongoose';
import { Material, IMaterial } from '../../models/Material';
import { BomItem, IBomItem } from '../../models/Bom';
import { LabourType, ILabourType } from '../../models/Labour';
import { ManpowerItem, IManpowerItem } from '../../models/Manpower';
import { MachineryType, IMachineryType } from '../../models/Machinery';
import { MachineryItem, IMachineryItem } from '../../models/Machinery';
import { BoqItem } from '../../models/Boq';
import { AppError } from '../../middleware/error.middleware';

export class ResourcesService {
  /* ======================================================================
     BOM (Bill of Materials)
     ====================================================================== */
  public static async getBomItems(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    return BomItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
    })
      .populate('boqItemId', 'itemCode description unit quantity executedQuantity balanceQuantity progressPercent rateAnalysisStatus')
      .populate('materialId', 'code name category standardRate')
      .sort({ createdAt: 1 })
      .lean();
  }

  public static async addBomItem(
    companyId: string,
    projectId: string,
    input: {
      boqItemId: string;
      materialName: string;
      unit: string;
      coefficient: number;
      unitRate: number;
      materialId?: string;
      remarks?: string;
    }
  ) {
    const boqItem = await BoqItem.findById(input.boqItemId);
    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const requiredQuantity = Number((boqItem.quantity * input.coefficient).toFixed(3));
    const amount = Number((requiredQuantity * input.unitRate).toFixed(2));

    return BomItem.create({
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
      boqId: boqItem.boqId,
      boqItemId: boqItem._id,
      materialId: input.materialId ? new Types.ObjectId(input.materialId) : null,
      materialName: input.materialName.trim(),
      unit: input.unit.trim(),
      coefficient: input.coefficient,
      boqQuantity: boqItem.quantity,
      requiredQuantity,
      unitRate: input.unitRate,
      amount,
      source: 'MANUAL',
      remarks: input.remarks || '',
    });
  }

  public static async deleteBomItem(companyId: string, projectId: string, id: string) {
    await BomItem.deleteOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });
    return { success: true, message: 'BOM item removed' };
  }

  /* ======================================================================
     MANPOWER (Bill of Manpower)
     ====================================================================== */
  public static async getManpowerItems(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    return ManpowerItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
    })
      .populate('boqItemId', 'itemCode description unit quantity executedQuantity balanceQuantity progressPercent rateAnalysisStatus')
      .populate('labourTypeId', 'code name category standardDailyRate')
      .sort({ createdAt: 1 })
      .lean();
  }

  public static async addManpowerItem(
    companyId: string,
    projectId: string,
    input: {
      boqItemId: string;
      labourType: string;
      coefficient: number;
      unitRate: number;
      labourTypeId?: string;
      remarks?: string;
    }
  ) {
    const boqItem = await BoqItem.findById(input.boqItemId);
    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const requiredManpower = Number((boqItem.quantity * input.coefficient).toFixed(2));
    const amount = Number((requiredManpower * input.unitRate).toFixed(2));

    return ManpowerItem.create({
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
      boqId: boqItem.boqId,
      boqItemId: boqItem._id,
      labourTypeId: input.labourTypeId ? new Types.ObjectId(input.labourTypeId) : null,
      labourType: input.labourType.trim(),
      coefficient: input.coefficient,
      boqQuantity: boqItem.quantity,
      requiredManpower,
      unitRate: input.unitRate,
      amount,
      source: 'MANUAL',
      remarks: input.remarks || '',
    });
  }

  public static async deleteManpowerItem(companyId: string, projectId: string, id: string) {
    await ManpowerItem.deleteOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });
    return { success: true, message: 'Manpower item removed' };
  }

  /* ======================================================================
     MACHINERY (Bill of Machinery)
     ====================================================================== */
  public static async getMachineryItems(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    return MachineryItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
    })
      .populate('boqItemId', 'itemCode description unit quantity executedQuantity balanceQuantity progressPercent rateAnalysisStatus')
      .populate('machineryTypeId', 'code name category standardHourlyRate')
      .sort({ createdAt: 1 })
      .lean();
  }

  public static async addMachineryItem(
    companyId: string,
    projectId: string,
    input: {
      boqItemId: string;
      machineryType: string;
      coefficient: number;
      unitRate: number;
      machineryTypeId?: string;
      remarks?: string;
    }
  ) {
    const boqItem = await BoqItem.findById(input.boqItemId);
    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const requiredHours = Number((boqItem.quantity * input.coefficient).toFixed(2));
    const amount = Number((requiredHours * input.unitRate).toFixed(2));

    return MachineryItem.create({
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
      boqId: boqItem.boqId,
      boqItemId: boqItem._id,
      machineryTypeId: input.machineryTypeId ? new Types.ObjectId(input.machineryTypeId) : null,
      machineryType: input.machineryType.trim(),
      coefficient: input.coefficient,
      boqQuantity: boqItem.quantity,
      requiredHours,
      unitRate: input.unitRate,
      amount,
      source: 'MANUAL',
      remarks: input.remarks || '',
    });
  }

  public static async deleteMachineryItem(companyId: string, projectId: string, id: string) {
    await MachineryItem.deleteOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });
    return { success: true, message: 'Machinery item removed' };
  }

  /* ======================================================================
     DYNAMIC MASTERS (Materials, Labour Types, Machinery Types)
     ====================================================================== */
  public static async getMaterialsMaster(companyId: string) {
    return Material.find({ companyId: new Types.ObjectId(companyId) }).sort({ name: 1 }).lean();
  }

  public static async getLabourTypesMaster(companyId: string) {
    return LabourType.find({ companyId: new Types.ObjectId(companyId) }).sort({ name: 1 }).lean();
  }

  public static async getMachineryTypesMaster(companyId: string) {
    return MachineryType.find({ companyId: new Types.ObjectId(companyId) }).sort({ name: 1 }).lean();
  }

  public static async createLabourType(companyId: string, input: { code: string; name: string; standardDailyRate: number; category?: string; unit?: string }) {
    return LabourType.create({
      companyId: new Types.ObjectId(companyId),
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      standardDailyRate: input.standardDailyRate,
      category: input.category || 'Skilled',
      unit: input.unit || 'Day',
    });
  }

  public static async createMachineryType(companyId: string, input: { code: string; name: string; standardHourlyRate: number; category?: string; unit?: string }) {
    return MachineryType.create({
      companyId: new Types.ObjectId(companyId),
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      standardHourlyRate: input.standardHourlyRate,
      category: input.category || 'General Equipment',
      unit: input.unit || 'Hour',
    });
  }
}
