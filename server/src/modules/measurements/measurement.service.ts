import { Types } from 'mongoose';
import { Measurement, IMeasurement, IMeasurementEntry, MeasurementFormula } from '../../models/Measurement';
import { Boq, BoqItem, IBoqItem } from '../../models/Boq';
import { SorItem } from '../../models/SorMaster';
import { Project } from '../../models/Project';
import { BomItem } from '../../models/Bom';
import { ManpowerItem } from '../../models/Manpower';
import { MachineryItem } from '../../models/Machinery';
import { RateAnalysisService } from '../sor/rateAnalysis.service';
import { CalculationEngine, MeasurementDimensions } from '../engine/calculation.engine';
import { UnitDimensionEngine } from '../engine/unit.validator';
import { AppError } from '../../middleware/error.middleware';
import { AuditService } from '../audit/audit.service';

export interface CreateMeasurementEntryInput {
  sorItemId?: string;
  itemCode?: string;
  boqItemId?: string;
  description?: string;
  location?: string;
  levelFloor?: string;
  nos?: number;
  length?: number;
  width?: number;
  breadth?: number;
  heightDepth?: number;
  height?: number;
  depth?: number;
  thickness?: number;
  weight?: number;
  unitWeight?: number;
  unit?: string;
  rate?: number;
  formula?: MeasurementFormula | string;
  remarks?: string;
  measurementDate?: string;
}

export class MeasurementService {
  /**
   * Calculate single measurement entry quantity based on formula and dimensions
   */
  public static calculateQuantity(
    formula: MeasurementFormula | string,
    nos: number,
    length: number,
    width: number,
    heightDepth: number
  ): number {
    const res = CalculationEngine.calculateQuantity(formula, {
      nos,
      length,
      width,
      heightDepth,
    });
    return res.calculatedQuantity;
  }

  /**
   * Get all measurements for a project with traceability and status
   */
  public static async getMeasurements(companyId: string, projectId: string, boqItemId?: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const filter: Record<string, unknown> = {
      companyId: compObjectId,
      projectId: projObjectId,
    };

    if (boqItemId && Types.ObjectId.isValid(boqItemId)) {
      filter.boqItemId = new Types.ObjectId(boqItemId);
    }

    return Measurement.find(filter)
      .populate('boqItemId', 'itemCode description unit quantity executedQuantity balanceQuantity progressPercent rateAnalysisStatus')
      .populate('sorItemId', 'itemCode descriptionEnglish unit rate chapter workCategory measurementFormula')
      .populate('sorId', 'authority sorName version department scheduleType')
      .populate('approvedBy', 'name email')
      .populate('reversedBy', 'name email')
      .sort({ measurementDate: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Get measurement dashboard summary for project
   */
  public static async getMeasurementSummary(companyId: string, projectId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    const [totalMeasurements, boqStats, bomStats, manpowerStats, machineryStats] = await Promise.all([
      Measurement.countDocuments({
        companyId: compObjectId,
        projectId: projObjectId,
        isReversed: { $ne: true },
      }),
      BoqItem.aggregate([
        { $match: { companyId: compObjectId, projectId: projObjectId } },
        {
          $group: {
            _id: null,
            totalBoqAmount: { $sum: '$amount' },
            totalItems: { $sum: 1 },
          },
        },
      ]),
      BomItem.aggregate([
        { $match: { companyId: compObjectId, projectId: projObjectId } },
        { $group: { _id: null, totalAmount: { $sum: '$executedAmount' } } },
      ]),
      ManpowerItem.aggregate([
        { $match: { companyId: compObjectId, projectId: projObjectId } },
        { $group: { _id: null, totalAmount: { $sum: '$executedAmount' } } },
      ]),
      MachineryItem.aggregate([
        { $match: { companyId: compObjectId, projectId: projObjectId } },
        { $group: { _id: null, totalAmount: { $sum: '$executedAmount' } } },
      ]),
    ]);

    const totalBoqAmount = boqStats[0]?.totalBoqAmount || 0;
    const totalMaterialCost = bomStats[0]?.totalAmount || 0;
    const totalManpowerCost = manpowerStats[0]?.totalAmount || 0;
    const totalMachineryCost = machineryStats[0]?.totalAmount || 0;
    const totalProjectCost = totalBoqAmount;

    return {
      totalMeasurements,
      totalBoqAmount: Number(totalBoqAmount.toFixed(2)),
      totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
      totalManpowerCost: Number(totalManpowerCost.toFixed(2)),
      totalMachineryCost: Number(totalMachineryCost.toFixed(2)),
      totalProjectCost: Number(totalProjectCost.toFixed(2)),
    };
  }

  /**
   * Add a measurement entry.
   * Automated measurement-driven workflow:
   * Accepts DSR/SOR item or BOQ item, creates/aggregates BOQ automatically,
   * calculates quantity, rate, amount, and cascades BOM, Manpower, Machinery.
   */
  public static async addMeasurementEntry(
    companyId: string,
    projectId: string,
    userId: string,
    input: CreateMeasurementEntryInput
  ): Promise<IMeasurement> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    // 1. Get or create target BoqItem for this measurement
    let boqItem: IBoqItem | null = null;
    let targetSorItem: any = null;

    if (input.boqItemId && Types.ObjectId.isValid(input.boqItemId)) {
      boqItem = await BoqItem.findOne({
        _id: new Types.ObjectId(input.boqItemId),
        companyId: compObjectId,
        projectId: projObjectId,
      });
    }

    // If no boqItem found, resolve from sorItemId or itemCode
    if (!boqItem && (input.sorItemId || input.itemCode)) {
      let sorQuery: Record<string, unknown> = {};
      if (input.sorItemId && Types.ObjectId.isValid(input.sorItemId)) {
        sorQuery._id = new Types.ObjectId(input.sorItemId);
      } else if (input.itemCode) {
        sorQuery.itemCode = input.itemCode.trim();
      }

      targetSorItem = await SorItem.findOne(sorQuery).populate('sorId');

      if (targetSorItem) {
        // Check if BOQ item already exists for this SorItem in this project
        boqItem = await BoqItem.findOne({
          companyId: compObjectId,
          projectId: projObjectId,
          $or: [
            { 'sorReference.sorItemId': targetSorItem._id },
            { itemCode: targetSorItem.itemCode },
          ],
        });

        // If not found, automatically create the BOQ item
        if (!boqItem) {
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
              createdBy: new Types.ObjectId(userId),
            });
          }

          const nextItemNumber = (await BoqItem.countDocuments({ boqId: boq._id })) + 1;
          const sorMaster = targetSorItem.sorId as unknown as { _id: Types.ObjectId; sorName?: string; version?: string };

          boqItem = await BoqItem.create({
            companyId: compObjectId,
            projectId: projObjectId,
            boqId: boq._id,
            itemNumber: nextItemNumber,
            itemCode: targetSorItem.itemCode,
            description: input.description || targetSorItem.descriptionEnglish,
            unit: input.unit || targetSorItem.unit,
            quantity: 0, // Will be aggregated by calculation engine
            rate: input.rate !== undefined && input.rate > 0 ? input.rate : targetSorItem.rate,
            amount: 0,
            chapter: targetSorItem.chapter || '',
            subChapter: targetSorItem.subChapter || '',
            sorReference: {
              sorId: sorMaster?._id || targetSorItem.sorId,
              sorItemId: targetSorItem._id,
              scheduleName: sorMaster?.sorName || 'Schedule of Rates',
              version: sorMaster?.version || 'Latest',
              snapshotRate: targetSorItem.rate,
            },
            isDerivedFromMeasurement: true,
            executedQuantity: 0,
            balanceQuantity: 0,
            progressPercent: 0,
            rateAnalysisStatus: 'NOT_AVAILABLE',
            allowExcessQuantity: true,
          });
        }
      }
    }

    if (!boqItem) {
      throw new AppError('Could not resolve or create target BOQ / SOR item for this measurement', 404);
    }

    // 2. Perform authoritative formula calculation
    const dims: MeasurementDimensions = {
      nos: input.nos,
      length: input.length,
      width: input.width,
      breadth: input.breadth,
      height: input.height,
      depth: input.depth,
      heightDepth: input.heightDepth,
      thickness: input.thickness,
      weight: input.weight,
      unitWeight: input.unitWeight,
    };

    const formula = input.formula || targetSorItem?.measurementFormula || 'LxWxH';
    const rawUnit = input.unit || boqItem.unit || targetSorItem?.unit || 'cum';

    // Strict Dimensional Validation
    const dimValidation = UnitDimensionEngine.validateDimensionalCompatibility(formula, rawUnit, boqItem.itemCode);
    if (!dimValidation.isValid) {
      throw new AppError(dimValidation.errorMessage || 'DATA_CONFIGURATION_ERROR: Dimensional mismatch.', 400);
    }
    const unit = dimValidation.canonicalUnit;

    const { calculatedQuantity, formulaExpression } = CalculationEngine.calculateQuantity(formula, dims, rawUnit, boqItem.itemCode);

    if (calculatedQuantity <= 0) {
      throw new AppError('Calculated measurement quantity must be greater than zero. Please verify input dimensions.', 400);
    }

    // BOQ Quantity Validation Rule: Do not allow exceeding planned BOQ quantity if allowExcessQuantity is false
    if (!boqItem.get('isDerivedFromMeasurement') && boqItem.quantity > 0 && !boqItem.allowExcessQuantity) {
      const remainingBalance = Math.max(0, Number((boqItem.quantity - (boqItem.executedQuantity || 0)).toFixed(3)));
      if (calculatedQuantity > remainingBalance + 0.0001) {
        throw new AppError(
          `Measurement quantity (${calculatedQuantity} ${unit}) exceeds remaining BOQ balance (${remainingBalance} ${unit}). Planned BOQ quantity is ${boqItem.quantity} ${unit}. Excess quantity is not permitted for item '${boqItem.itemCode}'.`,
          400
        );
      }
    }

    const unitRate = input.rate !== undefined && input.rate > 0 ? input.rate : boqItem.rate;
    const amount = CalculationEngine.calculateAmount(calculatedQuantity, unitRate);

    // 3. Create measurement entry
    const entry: IMeasurementEntry = {
      description: input.description?.trim() || boqItem.description,
      location: input.location?.trim() || '',
      levelFloor: input.levelFloor?.trim() || '',
      nos: input.nos !== undefined && !isNaN(input.nos) ? input.nos : 1,
      length: input.length || 0,
      width: input.width || 0,
      breadth: input.breadth || 0,
      heightDepth: input.heightDepth || 0,
      height: input.height || 0,
      depth: input.depth || 0,
      thickness: input.thickness || 0,
      weight: input.weight || 0,
      unitWeight: input.unitWeight || 0,
      unit,
      formula,
      formulaExpression,
      calculatedQuantity,
      remarks: input.remarks || '',
    };

    const measurement = await Measurement.create({
      companyId: compObjectId,
      projectId: projObjectId,
      boqId: boqItem.boqId,
      boqItemId: boqItem._id,
      sorId: boqItem.sorReference?.sorId || targetSorItem?.sorId?._id || null,
      sorItemId: boqItem.sorReference?.sorItemId || targetSorItem?._id || null,
      scheduleName: boqItem.sorReference?.scheduleName || '',
      scheduleVersion: boqItem.sorReference?.version || '',
      sourceItemCode: boqItem.itemCode,
      unitRate,
      amount,
      measurementDate: input.measurementDate ? new Date(input.measurementDate) : new Date(),
      status: 'Approved',
      entries: [entry],
      totalQuantity: calculatedQuantity,
      currentQuantity: calculatedQuantity,
      isReversed: false,
      createdBy: new Types.ObjectId(userId),
      approvedBy: new Types.ObjectId(userId),
      approvedAt: new Date(),
    });

    // 4. Authoritative backend synchronization of BOQ, BOM, Manpower, Machinery, and Totals
    await CalculationEngine.syncProjectStateFromMeasurements(
      companyId,
      projectId,
      boqItem._id.toString(),
      measurement._id.toString()
    );

    await AuditService.log({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Measurement',
      entityId: measurement._id.toString(),
      newValue: {
        itemCode: boqItem.itemCode,
        quantity: calculatedQuantity,
        formula,
        amount,
      },
    });

    return measurement;
  }

  /**
   * Update an existing measurement entry.
   * Recalculates quantity, rate, amount, and cascades all dependent modules.
   */
  public static async updateMeasurement(
    companyId: string,
    projectId: string,
    userId: string,
    measurementId: string,
    input: Partial<CreateMeasurementEntryInput>
  ): Promise<IMeasurement> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);
    const measObjectId = new Types.ObjectId(measurementId);

    const measurement = await Measurement.findOne({
      _id: measObjectId,
      companyId: compObjectId,
      projectId: projObjectId,
    });

    if (!measurement) {
      throw new AppError('Measurement record not found', 404);
    }

    if (measurement.isReversed) {
      throw new AppError('Cannot edit a reversed measurement', 400);
    }

    const existingEntry = measurement.entries[0] || ({} as IMeasurementEntry);

    const dims: MeasurementDimensions = {
      nos: input.nos !== undefined ? input.nos : existingEntry.nos,
      length: input.length !== undefined ? input.length : existingEntry.length,
      width: input.width !== undefined ? input.width : existingEntry.width,
      breadth: input.breadth !== undefined ? input.breadth : existingEntry.breadth,
      height: input.height !== undefined ? input.height : existingEntry.height,
      depth: input.depth !== undefined ? input.depth : existingEntry.depth,
      heightDepth: input.heightDepth !== undefined ? input.heightDepth : existingEntry.heightDepth,
      thickness: input.thickness !== undefined ? input.thickness : existingEntry.thickness,
      weight: input.weight !== undefined ? input.weight : existingEntry.weight,
      unitWeight: input.unitWeight !== undefined ? input.unitWeight : existingEntry.unitWeight,
    };

    const formula = input.formula || existingEntry.formula || 'LxWxH';
    const rawUnit = input.unit || existingEntry.unit || 'cum';

    // Strict Dimensional Validation
    const dimValidation = UnitDimensionEngine.validateDimensionalCompatibility(formula, rawUnit, measurement.sourceItemCode);
    if (!dimValidation.isValid) {
      throw new AppError(dimValidation.errorMessage || 'DATA_CONFIGURATION_ERROR: Dimensional mismatch.', 400);
    }
    const unit = dimValidation.canonicalUnit;

    const { calculatedQuantity, formulaExpression } = CalculationEngine.calculateQuantity(formula, dims, rawUnit, measurement.sourceItemCode);

    if (calculatedQuantity <= 0) {
      throw new AppError('Calculated measurement quantity must be greater than zero.', 400);
    }

    // BOQ Quantity Validation for existing contract BOQ items
    const boqItem = await BoqItem.findById(measurement.boqItemId);
    if (boqItem && !boqItem.get('isDerivedFromMeasurement') && boqItem.quantity > 0 && !boqItem.allowExcessQuantity) {
      const otherExecutedQty = Math.max(0, (boqItem.executedQuantity || 0) - measurement.totalQuantity);
      if (otherExecutedQty + calculatedQuantity > boqItem.quantity + 0.0001) {
        throw new AppError(
          `Updated measurement quantity (${calculatedQuantity} ${unit}) would cause total executed quantity (${(otherExecutedQty + calculatedQuantity).toFixed(3)} ${unit}) to exceed planned BOQ limit (${boqItem.quantity} ${unit}). Excess quantity is not permitted for item '${boqItem.itemCode}'.`,
          400
        );
      }
    }

    const unitRate = input.rate !== undefined && input.rate > 0 ? input.rate : (measurement.unitRate || 0);
    const amount = CalculationEngine.calculateAmount(calculatedQuantity, unitRate);

    // Update entry fields
    const updatedEntry: IMeasurementEntry = {
      description: input.description !== undefined ? input.description.trim() : existingEntry.description,
      location: input.location !== undefined ? input.location.trim() : existingEntry.location,
      levelFloor: input.levelFloor !== undefined ? input.levelFloor.trim() : existingEntry.levelFloor,
      nos: dims.nos || 1,
      length: dims.length || 0,
      width: dims.width || 0,
      breadth: dims.breadth || 0,
      heightDepth: dims.heightDepth || 0,
      height: dims.height || 0,
      depth: dims.depth || 0,
      thickness: dims.thickness || 0,
      weight: dims.weight || 0,
      unitWeight: dims.unitWeight || 0,
      unit,
      formula,
      formulaExpression,
      calculatedQuantity,
      remarks: input.remarks !== undefined ? input.remarks : existingEntry.remarks,
    };

    measurement.entries = [updatedEntry];
    measurement.totalQuantity = calculatedQuantity;
    measurement.currentQuantity = calculatedQuantity;
    measurement.unitRate = unitRate;
    measurement.amount = amount;
    if (input.measurementDate) {
      measurement.measurementDate = new Date(input.measurementDate);
    }

    await measurement.save();

    // Cascading sync
    await CalculationEngine.syncProjectStateFromMeasurements(
      companyId,
      projectId,
      measurement.boqItemId.toString(),
      measurement._id.toString()
    );

    await AuditService.log({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Measurement',
      entityId: measurement._id.toString(),
      newValue: {
        totalQuantity: calculatedQuantity,
        amount,
      },
    });

    return measurement;
  }

  /**
   * Duplicate a measurement entry
   */
  public static async duplicateMeasurement(
    companyId: string,
    projectId: string,
    userId: string,
    measurementId: string
  ): Promise<IMeasurement> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);
    const measObjectId = new Types.ObjectId(measurementId);

    const original = await Measurement.findOne({
      _id: measObjectId,
      companyId: compObjectId,
      projectId: projObjectId,
    });

    if (!original) {
      throw new AppError('Measurement record not found', 404);
    }

    const entry = original.entries[0] || ({} as IMeasurementEntry);

    const duplicatedEntry: IMeasurementEntry = {
      description: `${entry.description} (Copy)`.trim(),
      location: entry.location || '',
      levelFloor: entry.levelFloor || '',
      nos: entry.nos || 1,
      length: entry.length || 0,
      width: entry.width || 0,
      breadth: entry.breadth || 0,
      heightDepth: entry.heightDepth || 0,
      height: entry.height || 0,
      depth: entry.depth || 0,
      thickness: entry.thickness || 0,
      weight: entry.weight || 0,
      unitWeight: entry.unitWeight || 0,
      unit: entry.unit,
      formula: entry.formula,
      formulaExpression: entry.formulaExpression,
      calculatedQuantity: entry.calculatedQuantity,
      remarks: entry.remarks || '',
    };

    const duplicate = await Measurement.create({
      companyId: compObjectId,
      projectId: projObjectId,
      boqId: original.boqId,
      boqItemId: original.boqItemId,
      sorId: original.sorId,
      sorItemId: original.sorItemId,
      scheduleName: original.scheduleName,
      scheduleVersion: original.scheduleVersion,
      sourceItemCode: original.sourceItemCode,
      unitRate: original.unitRate,
      amount: original.amount,
      measurementDate: new Date(),
      status: 'Approved',
      entries: [duplicatedEntry],
      totalQuantity: original.totalQuantity,
      currentQuantity: original.totalQuantity,
      isReversed: false,
      createdBy: new Types.ObjectId(userId),
      approvedBy: new Types.ObjectId(userId),
      approvedAt: new Date(),
    });

    // Cascading sync
    await CalculationEngine.syncProjectStateFromMeasurements(
      companyId,
      projectId,
      original.boqItemId.toString(),
      duplicate._id.toString()
    );

    await AuditService.log({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Measurement',
      entityId: duplicate._id.toString(),
      newValue: {
        duplicatedFrom: measurementId,
        totalQuantity: duplicate.totalQuantity,
      },
    });

    return duplicate;
  }

  /**
   * Approve a measurement record
   */
  public static async approveMeasurement(
    companyId: string,
    projectId: string,
    userId: string,
    measurementId: string
  ) {
    const measurement = await Measurement.findOne({
      _id: new Types.ObjectId(measurementId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!measurement) {
      throw new AppError('Measurement record not found', 404);
    }

    if (measurement.isReversed) {
      throw new AppError('Cannot approve a reversed measurement', 400);
    }

    measurement.status = 'Approved';
    measurement.approvedBy = new Types.ObjectId(userId);
    measurement.approvedAt = new Date();
    await measurement.save();

    await CalculationEngine.syncProjectStateFromMeasurements(
      companyId,
      projectId,
      measurement.boqItemId.toString(),
      measurement._id.toString()
    );

    return measurement;
  }

  /**
   * Reverse an approved measurement
   */
  public static async reverseMeasurement(
    companyId: string,
    projectId: string,
    userId: string,
    measurementId: string,
    reason?: string
  ) {
    const measurement = await Measurement.findOne({
      _id: new Types.ObjectId(measurementId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!measurement) {
      throw new AppError('Measurement record not found', 404);
    }

    if (measurement.isReversed) {
      throw new AppError('Measurement is already reversed', 400);
    }

    measurement.isReversed = true;
    measurement.status = 'Reversed';
    measurement.reversedBy = new Types.ObjectId(userId);
    measurement.reversedAt = new Date();
    measurement.reversalReason = reason?.trim() || 'Measurement reversed by engineer';
    await measurement.save();

    await CalculationEngine.syncProjectStateFromMeasurements(
      companyId,
      projectId,
      measurement.boqItemId.toString()
    );

    return measurement;
  }

  /**
   * Delete a measurement record with automatic cascade recalculation / cleanup
   */
  public static async deleteMeasurement(
    companyId: string,
    projectId: string,
    userId: string,
    measurementId: string
  ) {
    const measurement = await Measurement.findOne({
      _id: new Types.ObjectId(measurementId),
      companyId: new Types.ObjectId(companyId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!measurement) {
      throw new AppError('Measurement record not found', 404);
    }

    const boqItemId = measurement.boqItemId.toString();
    await Measurement.deleteOne({ _id: measurement._id });

    // Cascading sync & clean up
    await CalculationEngine.syncProjectStateFromMeasurements(companyId, projectId, boqItemId);

    await AuditService.log({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Measurement',
      entityId: measurementId,
      oldValue: { totalQuantity: measurement.totalQuantity },
    });

    return { success: true, message: 'Measurement deleted and all dependent records recalculated' };
  }

  /**
   * Downstream cascade helper (backward compatibility)
   */
  public static async recalculateDownstreamExecution(
    boqItemId: string,
    companyId?: string,
    projectId?: string,
    lastMeasurementId?: string
  ): Promise<void> {
    const boqItem = await BoqItem.findById(boqItemId);
    if (!boqItem) return;

    const resolvedCompanyId = companyId || boqItem.companyId.toString();
    const resolvedProjectId = projectId || boqItem.projectId.toString();

    await CalculationEngine.syncProjectStateFromMeasurements(
      resolvedCompanyId,
      resolvedProjectId,
      boqItemId,
      lastMeasurementId
    );
  }
}
