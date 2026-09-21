import { Types } from 'mongoose';
import { Boq, IBoq, BoqItem, IBoqItem } from '../../models/Boq';
import { SorItem } from '../../models/SorMaster';
import { AppError } from '../../middleware/error.middleware';
import { AuditService } from '../audit/audit.service';

export interface AddBoqItemInput {
  sorItemId?: string;
  itemCode?: string;
  description?: string;
  unit?: string;
  quantity: number;
  rate?: number;
  chapter?: string;
  subChapter?: string;
  remarks?: string;
}

export class BoqService {
  /**
   * Get or initialize default BOQ for a project
   */
  public static async getOrCreateBoq(companyId: string, projectId: string, userId: string): Promise<IBoq> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    let boq = await Boq.findOne({
      companyId: compObjectId,
      projectId: projObjectId,
      status: { $ne: 'Archived' },
    });

    if (!boq) {
      boq = await Boq.create({
        companyId: compObjectId,
        projectId: projObjectId,
        title: 'Main Project BOQ',
        version: '1.0',
        status: 'Draft',
        totalItems: 0,
        totalQuantity: 0,
        totalBoqValue: 0,
        createdBy: new Types.ObjectId(userId),
      });
    }

    return boq;
  }

  /**
   * Get all items for a BOQ
   */
  public static async getBoqItems(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const boq = await Boq.findOne({
      companyId: compObjectId,
      projectId: projObjectId,
      status: { $ne: 'Archived' },
    });

    if (!boq) {
      return { boq: null, items: [] };
    }

    const items = await BoqItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
      boqId: boq._id,
    })
      .sort({ itemNumber: 1, createdAt: 1 })
      .lean();

    return { boq, items };
  }

  /**
   * Add item to BOQ (either snapshot from SOR or custom manual)
   */
  public static async addBoqItem(
    companyId: string,
    projectId: string,
    userId: string,
    input: AddBoqItemInput
  ): Promise<IBoqItem> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const boq = await this.getOrCreateBoq(companyId, projectId, userId);

    let code = input.itemCode || (input as any).itemNumber || (input as any).sorReference?.itemCode || '';
    let desc = input.description || '';
    let unit = input.unit || 'cum';
    let rate = input.rate || 0;
    let chapter = input.chapter || '';
    let sorReference: Record<string, unknown> | undefined = (input as any).sorReference || undefined;

    const sorItemId = input.sorItemId || (input as any).sorReference?.sorItemId;
    // If added from Rate Master / SOR, take an immutable point-in-time snapshot!
    if (sorItemId && Types.ObjectId.isValid(sorItemId)) {
      const sorItem = await SorItem.findById(sorItemId).populate('sorId');
      if (sorItem) {
        code = sorItem.itemCode || code;
        desc = input.description || sorItem.descriptionEnglish;
        unit = input.unit || sorItem.unit;
        rate = input.rate !== undefined && input.rate > 0 ? input.rate : sorItem.rate;
        chapter = sorItem.chapter || '';

        const sorMaster = sorItem.sorId as unknown as { sorName?: string; version?: string };
        sorReference = {
          sorId: sorItem.sorId,
          sorItemId: sorItem._id,
          scheduleName: sorMaster?.sorName || 'Schedule of Rates',
          version: sorMaster?.version || 'Latest',
          snapshotRate: sorItem.rate,
        };
      }
    }

    if (!code.trim()) {
      code = 'BOQ-' + ((await BoqItem.countDocuments({ boqId: boq._id })) + 1);
    }
    if (!desc.trim()) {
      throw new AppError('Description is required', 400);
    }
    if (input.quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400);
    }

    const nextItemNumber = (await BoqItem.countDocuments({ boqId: boq._id })) + 1;
    const amount = Number((input.quantity * rate).toFixed(2));

    const boqItem = await BoqItem.create({
      companyId: compObjectId,
      projectId: projObjectId,
      boqId: boq._id,
      itemNumber: nextItemNumber,
      itemCode: code.trim(),
      description: desc.trim(),
      unit: unit.trim(),
      quantity: input.quantity,
      rate,
      amount,
      sorReference,
      chapter,
      remarks: input.remarks || '',
      executedQuantity: 0,
      balanceQuantity: input.quantity,
      progressPercent: 0,
      rateAnalysisStatus: 'NOT_AVAILABLE',
      allowExcessQuantity: false,
    });

    // Check and set initial rate analysis status
    try {
      const { RateAnalysisService } = await import('../sor/rateAnalysis.service');
      const analysis = await RateAnalysisService.resolveAnalysisForBoqItem(companyId, boqItem);
      if (analysis.status === 'AVAILABLE') {
        boqItem.rateAnalysisStatus = analysis.source === 'CUSTOM' ? 'CUSTOM' : 'AVAILABLE';
        if (analysis.analysisId) {
          boqItem.rateAnalysisId = new Types.ObjectId(analysis.analysisId);
        }
        await boqItem.save();
      }
    } catch {
      // Non-blocking analysis resolution
    }

    // Authoritative backend recalculation of BOQ totals
    await this.recalculateBoqTotals(boq._id.toString());

    await AuditService.log({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'BoqItem',
      entityId: boqItem._id.toString(),
      newValue: {
        itemCode: boqItem.itemCode,
        quantity: boqItem.quantity,
        rate: boqItem.rate,
        amount: boqItem.amount,
      },
    });

    return boqItem;
  }

  /**
   * Update an existing BOQ item
   */
  public static async updateBoqItem(
    companyId: string,
    projectId: string,
    userId: string,
    itemId: string,
    updates: Partial<AddBoqItemInput & { executedQuantity?: number; allowExcessQuantity?: boolean }>
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const boqItem = await BoqItem.findOne({
      _id: new Types.ObjectId(itemId),
      companyId: compObjectId,
      projectId: projObjectId,
    });

    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const oldSnapshot = boqItem.toObject();

    if (updates.itemCode !== undefined) boqItem.itemCode = updates.itemCode.trim();
    if (updates.description !== undefined) boqItem.description = updates.description.trim();
    if (updates.unit !== undefined) boqItem.unit = updates.unit.trim();
    if (updates.quantity !== undefined) boqItem.quantity = Math.max(0, updates.quantity);
    if (updates.rate !== undefined) boqItem.rate = Math.max(0, updates.rate);
    if (updates.remarks !== undefined) boqItem.remarks = updates.remarks;
    if (updates.allowExcessQuantity !== undefined) boqItem.allowExcessQuantity = updates.allowExcessQuantity;

    // Recalculate amount, balance, progress
    boqItem.amount = Number((boqItem.quantity * boqItem.rate).toFixed(2));
    boqItem.balanceQuantity = Math.max(0, boqItem.quantity - boqItem.executedQuantity);
    boqItem.progressPercent =
      boqItem.quantity > 0
        ? Number(Math.min(100, (boqItem.executedQuantity / boqItem.quantity) * 100).toFixed(2))
        : 0;

    await boqItem.save();
    await this.recalculateBoqTotals(boqItem.boqId.toString());

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'BoqItem',
      entityId: boqItem._id.toString(),
      oldValue: { quantity: oldSnapshot.quantity, rate: oldSnapshot.rate, amount: oldSnapshot.amount },
      newValue: { quantity: boqItem.quantity, rate: boqItem.rate, amount: boqItem.amount },
    });

    return boqItem;
  }

  /**
   * Delete a BOQ item
   */
  public static async deleteBoqItem(companyId: string, projectId: string, userId: string, itemId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const boqItem = await BoqItem.findOne({
      _id: new Types.ObjectId(itemId),
      companyId: compObjectId,
      projectId: projObjectId,
    });

    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const boqId = boqItem.boqId.toString();
    await BoqItem.deleteOne({ _id: boqItem._id });
    await this.recalculateBoqTotals(boqId);

    await AuditService.log({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'BoqItem',
      entityId: itemId,
      oldValue: { itemCode: boqItem.itemCode, amount: boqItem.amount },
    });

    return { success: true, message: 'Item deleted from BOQ' };
  }

  /**
   * Approve a BOQ
   */
  public static async approveBoq(companyId: string, projectId: string, userId: string, boqId: string) {
    const boq = await Boq.findOne({
      _id: new Types.ObjectId(boqId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!boq) {
      throw new AppError('BOQ not found', 404);
    }

    boq.status = 'Approved';
    boq.approvedBy = new Types.ObjectId(userId);
    boq.approvedAt = new Date();
    await boq.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Boq',
      entityId: boq._id.toString(),
      newValue: { status: 'Approved', totalBoqValue: boq.totalBoqValue },
    });

    return boq;
  }

  /**
   * Backend authoritative recalculation of total items, quantities, and financial sum
   */
  public static async recalculateBoqTotals(boqId: string) {
    const stats = await BoqItem.aggregate([
      { $match: { boqId: new Types.ObjectId(boqId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalBoqValue: { $sum: '$amount' },
        },
      },
    ]);

    const result = stats[0] || { totalItems: 0, totalQuantity: 0, totalBoqValue: 0 };

    await Boq.findByIdAndUpdate(boqId, {
      totalItems: result.totalItems,
      totalQuantity: Number(result.totalQuantity.toFixed(2)),
      totalBoqValue: Number(result.totalBoqValue.toFixed(2)),
    });
  }

  /**
   * Get Rate Analysis for a specific BOQ item
   */
  public static async getItemRateAnalysis(companyId: string, projectId: string, itemId: string) {
    const boqItem = await BoqItem.findOne({
      _id: new Types.ObjectId(itemId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!boqItem) {
      throw new AppError('BOQ item not found', 404);
    }

    const { RateAnalysisService } = await import('../sor/rateAnalysis.service');
    const analysis = await RateAnalysisService.resolveAnalysisForBoqItem(companyId, boqItem);

    return {
      boqItemId: boqItem._id,
      itemCode: boqItem.itemCode,
      description: boqItem.description,
      unit: boqItem.unit,
      executedQuantity: boqItem.executedQuantity,
      rateAnalysisStatus: boqItem.rateAnalysisStatus || analysis.status,
      analysis,
    };
  }

  /**
   * Save controlled manual configuration of rate analysis for a BOQ item
   */
  public static async saveItemRateAnalysis(
    companyId: string,
    projectId: string,
    userId: string,
    itemId: string,
    composition: {
      materials?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
      labour?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
      machinery?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
    }
  ) {
    const { RateAnalysisService } = await import('../sor/rateAnalysis.service');
    const updatedItem = await RateAnalysisService.saveCustomAnalysisForBoqItem(
      companyId,
      projectId,
      userId,
      itemId,
      composition
    );

    // If there are already approved measurements for this item, trigger recalculation immediately!
    const { MeasurementService } = await import('../measurements/measurement.service');
    await MeasurementService.recalculateDownstreamExecution(itemId, companyId, projectId);

    return updatedItem;
  }
}
