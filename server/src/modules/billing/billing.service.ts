import { Types } from 'mongoose';
import { RunningBill, IRunningBill, IBillItem } from '../../models/RunningBill';
import { BoqItem } from '../../models/Boq';
import { Project } from '../../models/Project';
import { BomItem } from '../../models/Bom';
import { ManpowerItem } from '../../models/Manpower';
import { MachineryItem } from '../../models/Machinery';
import { AppError } from '../../middleware/error.middleware';
import { AuditService } from '../audit/audit.service';

export class BillingService {
  /**
   * Get all Running Bills for a project
   */
  public static async getBills(companyId: string, projectId: string) {
    return RunningBill.find({
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    })
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Create a new draft Running Account (RA) Bill from approved executed quantities
   */
  public static async generateDraftBill(
    companyId: string,
    projectId: string,
    userId: string,
    meta?: { periodFrom?: string; periodTo?: string; remarks?: string }
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    // Get all BOQ items for the project
    const boqItems = await BoqItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
    }).sort({ itemNumber: 1 });

    if (boqItems.length === 0) {
      throw new AppError('No BOQ items found for this project. Please create BOQ items before generating a bill.', 400);
    }

    // Determine next bill number
    const existingBillsCount = await RunningBill.countDocuments({
      companyId: compObjectId,
      projectId: projObjectId,
    });
    const billNumber = `RA-${String(existingBillsCount + 1).padStart(2, '0')}`;

    // Find all previously approved bills to determine previously billed quantities
    const approvedBills = await RunningBill.find({
      companyId: compObjectId,
      projectId: projObjectId,
      status: 'Approved',
    });

    // Map: boqItemId -> total previously billed quantity
    const prevBilledMap = new Map<string, number>();
    for (const b of approvedBills) {
      for (const it of b.items) {
        const idStr = it.boqItemId.toString();
        const existing = prevBilledMap.get(idStr) || 0;
        prevBilledMap.set(idStr, existing + it.currentQuantity);
      }
    }

    let totalPreviousAmount = 0;
    let totalCurrentAmount = 0;
    let totalCumulativeAmount = 0;

    const billItems: IBillItem[] = [];

    for (const item of boqItems) {
      const prevBilledQty = prevBilledMap.get(item._id.toString()) || 0;
      // Current quantity is approved executed quantity minus what was already billed
      const currentQty = Math.max(0, Number((item.executedQuantity - prevBilledQty).toFixed(3)));
      const cumulativeQty = Number((prevBilledQty + currentQty).toFixed(3));
      const balanceQty = Math.max(0, Number((item.quantity - cumulativeQty).toFixed(3)));

      const currentAmt = Number((currentQty * item.rate).toFixed(2));
      const cumulativeAmt = Number((cumulativeQty * item.rate).toFixed(2));

      totalPreviousAmount += prevBilledQty * item.rate;
      totalCurrentAmount += currentAmt;
      totalCumulativeAmount += cumulativeAmt;

      billItems.push({
        boqItemId: item._id,
        itemCode: item.itemCode,
        description: item.description,
        unit: item.unit,
        rate: item.rate,
        boqQuantity: item.quantity,
        previouslyBilledQuantity: prevBilledQty,
        currentQuantity: currentQty,
        cumulativeQuantity: cumulativeQty,
        balanceQuantity: balanceQty,
        currentAmount: currentAmt,
        cumulativeAmount: cumulativeAmt,
      });
    }

    const bill = await RunningBill.create({
      companyId: compObjectId,
      projectId: projObjectId,
      billNumber,
      billDate: new Date(),
      periodFrom: meta?.periodFrom ? new Date(meta.periodFrom) : null,
      periodTo: meta?.periodTo ? new Date(meta.periodTo) : null,
      status: 'Draft',
      totalPreviousAmount: Number(totalPreviousAmount.toFixed(2)),
      totalCurrentAmount: Number(totalCurrentAmount.toFixed(2)),
      totalCumulativeAmount: Number(totalCumulativeAmount.toFixed(2)),
      items: billItems,
      remarks: meta?.remarks || '',
      submittedBy: new Types.ObjectId(userId),
    });

    await AuditService.log({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'RunningBill',
      entityId: bill._id.toString(),
      newValue: {
        billNumber,
        totalCurrentAmount: bill.totalCurrentAmount,
      },
    });

    return bill;
  }

  /**
   * Submit bill for client / engineer approval
   */
  public static async submitBill(companyId: string, projectId: string, userId: string, billId: string) {
    const bill = await RunningBill.findOne({
      _id: new Types.ObjectId(billId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!bill) throw new AppError('Bill not found', 404);

    bill.status = 'Submitted';
    bill.submittedBy = new Types.ObjectId(userId);
    bill.submittedAt = new Date();
    await bill.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'RunningBill',
      entityId: billId,
      newValue: { status: 'Submitted' },
    });

    return bill;
  }

  /**
   * Approve running bill (requires billing.approve RBAC permission)
   */
  public static async approveBill(companyId: string, projectId: string, userId: string, billId: string) {
    const bill = await RunningBill.findOne({
      _id: new Types.ObjectId(billId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!bill) throw new AppError('Bill not found', 404);

    bill.status = 'Approved';
    bill.approvedBy = new Types.ObjectId(userId);
    bill.approvedAt = new Date();
    await bill.save();

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'RunningBill',
      entityId: billId,
      newValue: { status: 'Approved', totalCumulativeAmount: bill.totalCumulativeAmount },
    });

    return bill;
  }

  /**
   * Project Cost Control Overview
   * Dynamically aggregates financial metrics from stored project data
   */
  public static async getProjectCostControl(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const project = await Project.findOne({
      _id: projObjectId,
      companyId: compObjectId,
    }).lean();

    if (!project) throw new AppError('Project not found', 404);

    // 1. BOQ items & executed values
    const boqItems = await BoqItem.find({
      companyId: compObjectId,
      projectId: projObjectId,
    }).lean();

    const boqValue = boqItems.reduce((sum, item) => sum + item.amount, 0);
    const executedValue = boqItems.reduce(
      (sum, item) => sum + (item.executedQuantity || 0) * item.rate,
      0
    );

    // 2. Resource costs (Material, Manpower, Machinery)
    const [boms, manpower, machinery, bills] = await Promise.all([
      BomItem.find({ companyId: compObjectId, projectId: projObjectId }).lean(),
      ManpowerItem.find({ companyId: compObjectId, projectId: projObjectId }).lean(),
      MachineryItem.find({ companyId: compObjectId, projectId: projObjectId }).lean(),
      RunningBill.find({ companyId: compObjectId, projectId: projObjectId, status: 'Approved' }).lean(),
    ]);

    const materialCost = boms.reduce((sum, b) => sum + (b.executedAmount !== undefined ? b.executedAmount : b.amount), 0);
    const manpowerCost = manpower.reduce((sum, m) => sum + (m.executedAmount !== undefined ? m.executedAmount : m.amount), 0);
    const machineryCost = machinery.reduce((sum, m) => sum + (m.executedAmount !== undefined ? m.executedAmount : m.amount), 0);
    const directCostTotal = materialCost + manpowerCost + machineryCost;

    // 3. Billing totals
    const billedTotal = bills.reduce((sum, b) => sum + b.totalCurrentAmount, 0);

    const contractValue = project.contractValue || project.estimatedValue || boqValue;
    const remainingContractValue = Math.max(0, contractValue - billedTotal);
    const remainingBoqValue = Math.max(0, boqValue - executedValue);

    return {
      contractValue: Number(contractValue.toFixed(2)),
      boqValue: Number(boqValue.toFixed(2)),
      executedValue: Number(executedValue.toFixed(2)),
      materialCost: Number(materialCost.toFixed(2)),
      manpowerCost: Number(manpowerCost.toFixed(2)),
      machineryCost: Number(machineryCost.toFixed(2)),
      directCostTotal: Number(directCostTotal.toFixed(2)),
      billedTotal: Number(billedTotal.toFixed(2)),
      remainingContractValue: Number(remainingContractValue.toFixed(2)),
      remainingBoqValue: Number(remainingBoqValue.toFixed(2)),
      currency: project.currency || 'INR',
    };
  }
}
