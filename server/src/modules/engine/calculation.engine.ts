import { Types } from 'mongoose';
import { MeasurementFormula } from '../../models/Measurement';
import { Boq, BoqItem, IBoqItem } from '../../models/Boq';
import { Project } from '../../models/Project';
import { BomItem } from '../../models/Bom';
import { ManpowerItem } from '../../models/Manpower';
import { MachineryItem } from '../../models/Machinery';
import { Measurement } from '../../models/Measurement';
import { SorRateAnalysis } from '../../models/SorRateAnalysis';
import { RateAnalysisService } from '../sor/rateAnalysis.service';
import { UnitDimensionEngine } from './unit.validator';
import { AppError } from '../../middleware/error.middleware';

export interface MeasurementDimensions {
  nos?: number;
  length?: number;
  width?: number;
  breadth?: number;
  height?: number;
  depth?: number;
  heightDepth?: number;
  thickness?: number;
  weight?: number;
  unitWeight?: number;
  area?: number;
  volume?: number;
  quantity?: number;
}

export class CalculationEngine {
  /**
   * Authoritative formula calculation for measurement entry.
   * Strictly validates numeric inputs and enforces dimensional correctness.
   * Volume formulas (LxWxH, LxWxD) MUST produce Volume (m³ / cum), NEVER linear (mm).
   */
  public static calculateQuantity(
    formula: MeasurementFormula | string,
    dims: MeasurementDimensions,
    unit?: string,
    itemCode?: string
  ): { calculatedQuantity: number; formulaExpression: string; canonicalUnit: string } {
    const rawFormula = formula || 'LxWxH';
    const expectedDimension = UnitDimensionEngine.getExpectedDimensionForFormula(rawFormula);
    
    // Strict Dimensional Validation
    if (unit) {
      const validation = UnitDimensionEngine.validateDimensionalCompatibility(rawFormula, unit, itemCode);
      if (!validation.isValid) {
        throw new AppError(validation.errorMessage || 'DATA_CONFIGURATION_ERROR: Dimensional mismatch.', 400);
      }
    }

    const canonicalUnit = UnitDimensionEngine.getCanonicalUnit(unit, rawFormula);

    const nos = Math.max(0, dims.nos !== undefined && !isNaN(dims.nos) && dims.nos > 0 ? dims.nos : 1);
    const length = Math.max(0, dims.length && !isNaN(dims.length) ? dims.length : 0);
    const width = Math.max(0, dims.width && !isNaN(dims.width) ? dims.width : (dims.breadth && !isNaN(dims.breadth) ? dims.breadth : 0));
    const height = Math.max(0, dims.height && !isNaN(dims.height) ? dims.height : (dims.depth && !isNaN(dims.depth) ? dims.depth : (dims.heightDepth && !isNaN(dims.heightDepth) ? dims.heightDepth : 0)));
    const thickness = Math.max(0, dims.thickness && !isNaN(dims.thickness) ? dims.thickness : 0);
    const weight = Math.max(0, dims.weight && !isNaN(dims.weight) ? dims.weight : 0);
    const unitWeight = Math.max(0, dims.unitWeight && !isNaN(dims.unitWeight) ? dims.unitWeight : 0);

    let qty = 0;
    let expr = '';

    const normalizedFormula = rawFormula.toUpperCase();

    // Deduction detection (/deduct, /door, /window, or explicitly negative)
    const isDeduction =
      normalizedFormula.includes('DEDUCT') ||
      normalizedFormula.includes('/DOOR') ||
      normalizedFormula.includes('/WINDOW') ||
      normalizedFormula.startsWith('-');

    if (
      !isDeduction &&
      (normalizedFormula.includes('LXWXD') ||
        normalizedFormula === 'LXWXD' ||
        normalizedFormula === 'LXWXH' ||
        normalizedFormula === 'LXBXH' ||
        normalizedFormula === 'LXBXD' ||
        normalizedFormula.includes('LXBXH') ||
        normalizedFormula.includes('LXBXD') ||
        normalizedFormula === 'LXWXHXNOS' ||
        normalizedFormula === 'VOLUME' ||
        normalizedFormula === '/VOL' ||
        expectedDimension === 'VOLUME')
    ) {
      // 3D Volume (Earthwork, Concrete, Masonry) -> Evaluates to m³ (cum)
      const hOrD = height > 0 ? height : (thickness > 0 ? thickness : 1);
      qty = nos * (length || 0) * (width || 0) * hOrD;
      expr = `${nos > 1 ? nos + ' × ' : ''}${length}m × ${width}m × ${hOrD}m`;
    } else if (normalizedFormula.includes('/CIRCAREA') || normalizedFormula.includes('CIRCAREA')) {
      // Circular Area (pi/4 * d^2)
      const d = length > 0 ? length : (width > 0 ? width : height);
      qty = nos * (Math.PI / 4) * d * d;
      expr = `${nos > 1 ? nos + ' × ' : ''}π/4 × ${d}²`;
    } else if (normalizedFormula.includes('/CYLVOL') || normalizedFormula.includes('CYLVOL')) {
      // Cylinder Volume (pi/4 * d^2 * h)
      const d = length > 0 ? length : width;
      qty = nos * (Math.PI / 4) * d * d * (height || 1);
      expr = `${nos > 1 ? nos + ' × ' : ''}π/4 × ${d}² × ${height || 1}m`;
    } else if (normalizedFormula.includes('/PERIM') || normalizedFormula.includes('PERIMETER')) {
      // Perimeter: 2 * (L + B)
      qty = nos * 2 * ((length || 0) + (width || 0));
      expr = `${nos > 1 ? nos + ' × ' : ''}2 × (${length || 0} + ${width || 0})m`;
    } else if (normalizedFormula.includes('/CIRCPERIM')) {
      // Circumference: pi * d
      const d = length > 0 ? length : (width > 0 ? width : height);
      qty = nos * Math.PI * d;
      expr = `${nos > 1 ? nos + ' × ' : ''}π × ${d}m`;
    } else if (
      normalizedFormula.includes('LXW') ||
      normalizedFormula.includes('LXB') ||
      normalizedFormula.includes('LXH') ||
      normalizedFormula.includes('AREA') ||
      normalizedFormula === 'AREA' ||
      normalizedFormula === '/AREA' ||
      expectedDimension === 'AREA' ||
      isDeduction
    ) {
      // 2D Area (Plaster, Flooring, Painting, Formwork, Deductions) -> Evaluates to m² (sqm)
      const dim2 = width > 0 ? width : (height > 0 ? height : 1);
      const sign = isDeduction ? -1 : 1;
      qty = sign * Math.abs(nos * (length || 0) * dim2);
      expr = `${isDeduction ? '(-) ' : ''}${nos > 1 ? nos + ' × ' : ''}${length}m × ${dim2}m`;
    } else if (
      normalizedFormula === 'WEIGHT' ||
      normalizedFormula.includes('WEIGHT') ||
      normalizedFormula.includes('STEEL') ||
      expectedDimension === 'WEIGHT'
    ) {
      // Reinforcement / Weight (kg or tonne)
      if (unitWeight > 0) {
        qty = nos * (length || 1) * unitWeight;
        expr = `${nos} nos × ${length}m × ${unitWeight} kg/m`;
      } else if (weight > 0) {
        qty = nos * weight;
        expr = `${nos > 1 ? nos + ' × ' : ''}${weight} ${canonicalUnit}`;
      } else {
        qty = nos * (length || 1);
        expr = `${nos > 1 ? nos + ' × ' : ''}${length} ${canonicalUnit}`;
      }
    } else if (
      normalizedFormula === 'COUNT' ||
      normalizedFormula === 'NOSXQTY' ||
      normalizedFormula === 'NUMBERS' ||
      expectedDimension === 'COUNT'
    ) {
      // Direct count / numbers
      qty = dims.quantity && !isNaN(dims.quantity) && dims.quantity > 0 ? dims.quantity : (dims.nos || 1);
      expr = `${qty} ${canonicalUnit}`;
    } else {
      // Linear or custom
      const w = width > 0 ? width : 1;
      const h = height > 0 ? height : 1;
      qty = nos * (length || 1) * w * h;
      expr = `${nos > 1 ? nos + ' × ' : ''}${length || 1}m`;
    }

    if (isNaN(qty) || !isFinite(qty)) {
      qty = 0;
    }

    const roundedQty = Number(qty.toFixed(3));
    const fullExpr = `${expr} = ${roundedQty} ${canonicalUnit}`.trim();

    return {
      calculatedQuantity: roundedQty,
      formulaExpression: fullExpr,
      canonicalUnit,
    };
  }

  /**
   * Calculate financial amount safely
   */
  public static calculateAmount(quantity: number, rate: number): number {
    const q = Math.max(0, isNaN(quantity) ? 0 : quantity);
    const r = Math.max(0, isNaN(rate) ? 0 : rate);
    return Number((q * r).toFixed(2));
  }

  /**
   * Authoritative Live Preview Calculation Engine
   * Evaluates BOQ amount and resource breakdown (Materials, Manpower, Machinery)
   * without saving to database.
   */
  public static calculateImpactPreview(
    quantity: number,
    unitRate: number,
    rateAnalysis?: {
      materials?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
      labour?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
      machinery?: Array<{ name: string; unit: string; coefficient: number; unitRate: number; resourceCode?: string }>;
    }
  ) {
    const amount = this.calculateAmount(quantity, unitRate);

    const materials = (rateAnalysis?.materials || []).map((m) => {
      const requiredQty = Number((quantity * m.coefficient).toFixed(3));
      const cost = Number((requiredQty * m.unitRate).toFixed(2));
      return {
        name: m.name,
        unit: m.unit,
        coefficient: m.coefficient,
        unitRate: m.unitRate,
        requiredQuantity: requiredQty,
        amount: cost,
      };
    });

    const labour = (rateAnalysis?.labour || []).map((l) => {
      const requiredMandays = Number((quantity * l.coefficient).toFixed(2));
      const cost = Number((requiredMandays * l.unitRate).toFixed(2));
      return {
        name: l.name,
        unit: l.unit,
        coefficient: l.coefficient,
        unitRate: l.unitRate,
        requiredQuantity: requiredMandays,
        amount: cost,
      };
    });

    const machinery = (rateAnalysis?.machinery || []).map((mac) => {
      const requiredHours = Number((quantity * mac.coefficient).toFixed(2));
      const cost = Number((requiredHours * mac.unitRate).toFixed(2));
      return {
        name: mac.name,
        unit: mac.unit,
        coefficient: mac.coefficient,
        unitRate: mac.unitRate,
        requiredQuantity: requiredHours,
        amount: cost,
      };
    });

    const totalMaterialCost = materials.reduce((s, m) => s + m.amount, 0);
    const totalLabourCost = labour.reduce((s, l) => s + l.amount, 0);
    const totalMachineryCost = machinery.reduce((s, mac) => s + mac.amount, 0);
    const totalResourceCost = totalMaterialCost + totalLabourCost + totalMachineryCost;

    return {
      boqAmount: amount,
      materials,
      labour,
      machinery,
      totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
      totalLabourCost: Number(totalLabourCost.toFixed(2)),
      totalMachineryCost: Number(totalMachineryCost.toFixed(2)),
      totalResourceCost: Number(totalResourceCost.toFixed(2)),
      isAnalysisConfigured: materials.length > 0 || labour.length > 0 || machinery.length > 0,
    };
  }

  /**
   * Central Synchronization Engine:
   * Re-evaluates all measurements for the target BOQ item or entire project,
   * cascades authoritative updates to:
   * 1. BoqItem quantity, executedQuantity, amount, progressPercent
   * 2. BOM Items (Materials)
   * 3. Manpower Items (Labour)
   * 4. Machinery Items
   * 5. Boq total value & Project overall progress
   */
  public static async syncProjectStateFromMeasurements(
    companyId: string,
    projectId: string,
    targetBoqItemId?: string,
    lastMeasurementId?: string
  ): Promise<void> {
    const compObjectId = new Types.ObjectId(companyId);
    const projObjectId = new Types.ObjectId(projectId);

    // Get list of BOQ items to evaluate
    const boqItemFilter: Record<string, unknown> = {
      companyId: compObjectId,
      projectId: projObjectId,
    };
    if (targetBoqItemId && Types.ObjectId.isValid(targetBoqItemId)) {
      boqItemFilter._id = new Types.ObjectId(targetBoqItemId);
    }

    const boqItems = await BoqItem.find(boqItemFilter);

    for (const boqItem of boqItems) {
      // Find all active, approved, non-reversed measurements for this boqItem
      const approvedMeasurements = await Measurement.aggregate([
        {
          $match: {
            boqItemId: boqItem._id,
            status: { $in: ['Approved', 'Draft'] }, // count active measurements
            isReversed: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$totalQuantity' },
            measurementIds: { $push: '$_id' },
          },
        },
      ]);

      const aggResult = approvedMeasurements[0];
      const totalMeasuredQty = aggResult ? Number(aggResult.totalQuantity.toFixed(3)) : 0;
      const measurementIds = aggResult ? aggResult.measurementIds : [];

      // If item was derived from measurement and all measurements have been deleted:
      if (totalMeasuredQty === 0 && (boqItem.get('isDerivedFromMeasurement') || boqItem.quantity === 0)) {
        // Clean up derived downstream resources and remove empty derived BOQ item
        await Promise.all([
          BomItem.deleteMany({ companyId: compObjectId, projectId: projObjectId, boqItemId: boqItem._id }),
          ManpowerItem.deleteMany({ companyId: compObjectId, projectId: projObjectId, boqItemId: boqItem._id }),
          MachineryItem.deleteMany({ companyId: compObjectId, projectId: projObjectId, boqItemId: boqItem._id }),
          BoqItem.deleteOne({ _id: boqItem._id }),
        ]);
        continue;
      }

      // Update BOQ item
      if (boqItem.get('isDerivedFromMeasurement')) {
        boqItem.quantity = totalMeasuredQty;
        boqItem.executedQuantity = totalMeasuredQty;
        boqItem.balanceQuantity = 0;
        boqItem.progressPercent = totalMeasuredQty > 0 ? 100 : 0;
      } else {
        boqItem.executedQuantity = totalMeasuredQty;
        boqItem.balanceQuantity = Math.max(0, Number((boqItem.quantity - totalMeasuredQty).toFixed(3)));
        boqItem.progressPercent =
          boqItem.quantity > 0
            ? Number(Math.min(100, (totalMeasuredQty / boqItem.quantity) * 100).toFixed(2))
            : 0;
      }

      boqItem.amount = Number((boqItem.quantity * boqItem.rate).toFixed(2));
      boqItem.set('sourceMeasurementIds', measurementIds);

      // Resolve Rate Analysis from Database
      const rateAnalysis = await RateAnalysisService.resolveAnalysisForBoqItem(companyId, boqItem);

      if (rateAnalysis.status === 'AVAILABLE') {
        boqItem.rateAnalysisStatus = rateAnalysis.source === 'CUSTOM' ? 'CUSTOM' : 'AVAILABLE';
        if (rateAnalysis.analysisId) {
          boqItem.rateAnalysisId = new Types.ObjectId(rateAnalysis.analysisId);
        }

        const measurementRef = lastMeasurementId
          ? new Types.ObjectId(lastMeasurementId)
          : (measurementIds[measurementIds.length - 1] || null);

        // 1. Synchronize Bill of Materials (BOM)
        const currentMatNames = new Set(rateAnalysis.materials.map((m) => m.name));
        await BomItem.deleteMany({
          companyId: compObjectId,
          projectId: projObjectId,
          boqItemId: boqItem._id,
          materialName: { $nin: Array.from(currentMatNames) },
        });

        for (const mat of rateAnalysis.materials) {
          const plannedQuantity = Number((boqItem.quantity * mat.coefficient).toFixed(3));
          const executedQuantity = Number((boqItem.executedQuantity * mat.coefficient).toFixed(3));
          const balanceQuantity = Math.max(0, Number((plannedQuantity - executedQuantity).toFixed(3)));
          const unitRate = mat.unitRate;
          const amount = Number((executedQuantity * unitRate).toFixed(2));

          const traceText = `Measured: ${boqItem.executedQuantity} ${boqItem.unit} × Coefficient: ${mat.coefficient} ${mat.unit}/${boqItem.unit} = ${executedQuantity} ${mat.unit} @ ₹${unitRate}/${mat.unit} = ₹${amount.toLocaleString('en-IN')}`;

          await BomItem.findOneAndUpdate(
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqItemId: boqItem._id,
              materialName: mat.name,
            },
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqId: boqItem.boqId,
              boqItemId: boqItem._id,
              materialName: mat.name,
              unit: mat.unit,
              coefficient: mat.coefficient,
              boqQuantity: boqItem.quantity,
              plannedQuantity,
              executedQuantity,
              balanceQuantity,
              requiredQuantity: executedQuantity,
              unitRate,
              amount,
              executedAmount: amount,
              source: 'RATE_ANALYSIS',
              calculationTrace: {
                sorItemCode: rateAnalysis.itemCode,
                boqItemCode: boqItem.itemCode,
                formulaText: traceText,
                lastMeasurementId: measurementRef,
              },
            },
            { upsert: true, new: true }
          );
        }

        // 2. Synchronize Bill of Manpower
        const currentLabourNames = new Set(rateAnalysis.labour.map((l) => l.name));
        await ManpowerItem.deleteMany({
          companyId: compObjectId,
          projectId: projObjectId,
          boqItemId: boqItem._id,
          labourType: { $nin: Array.from(currentLabourNames) },
        });

        for (const lab of rateAnalysis.labour) {
          const plannedManpower = Number((boqItem.quantity * lab.coefficient).toFixed(2));
          const executedManpower = Number((boqItem.executedQuantity * lab.coefficient).toFixed(2));
          const balanceManpower = Math.max(0, Number((plannedManpower - executedManpower).toFixed(2)));
          const unitRate = lab.unitRate;
          const amount = Number((executedManpower * unitRate).toFixed(2));

          const traceText = `Measured: ${boqItem.executedQuantity} ${boqItem.unit} × Coefficient: ${lab.coefficient} Day/${boqItem.unit} = ${executedManpower} Days @ ₹${unitRate}/Day = ₹${amount.toLocaleString('en-IN')}`;

          await ManpowerItem.findOneAndUpdate(
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqItemId: boqItem._id,
              labourType: lab.name,
            },
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqId: boqItem.boqId,
              boqItemId: boqItem._id,
              labourType: lab.name,
              coefficient: lab.coefficient,
              boqQuantity: boqItem.quantity,
              plannedManpower,
              executedManpower,
              balanceManpower,
              requiredManpower: executedManpower,
              unitRate,
              amount,
              executedAmount: amount,
              source: 'RATE_ANALYSIS',
              calculationTrace: {
                sorItemCode: rateAnalysis.itemCode,
                boqItemCode: boqItem.itemCode,
                formulaText: traceText,
                lastMeasurementId: measurementRef,
              },
            },
            { upsert: true, new: true }
          );
        }

        // 3. Synchronize Bill of Machinery
        const currentMacNames = new Set(rateAnalysis.machinery.map((mac) => mac.name));
        await MachineryItem.deleteMany({
          companyId: compObjectId,
          projectId: projObjectId,
          boqItemId: boqItem._id,
          machineryType: { $nin: Array.from(currentMacNames) },
        });

        for (const mac of rateAnalysis.machinery) {
          const plannedHours = Number((boqItem.quantity * mac.coefficient).toFixed(2));
          const executedHours = Number((boqItem.executedQuantity * mac.coefficient).toFixed(2));
          const balanceHours = Math.max(0, Number((plannedHours - executedHours).toFixed(2)));
          const unitRate = mac.unitRate;
          const amount = Number((executedHours * unitRate).toFixed(2));

          const traceText = `Measured: ${boqItem.executedQuantity} ${boqItem.unit} × Coefficient: ${mac.coefficient} Hr/${boqItem.unit} = ${executedHours} Hours @ ₹${unitRate}/Hour = ₹${amount.toLocaleString('en-IN')}`;

          await MachineryItem.findOneAndUpdate(
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqItemId: boqItem._id,
              machineryType: mac.name,
            },
            {
              companyId: compObjectId,
              projectId: projObjectId,
              boqId: boqItem.boqId,
              boqItemId: boqItem._id,
              machineryType: mac.name,
              coefficient: mac.coefficient,
              boqQuantity: boqItem.quantity,
              plannedHours,
              executedHours,
              balanceHours,
              requiredHours: executedHours,
              unitRate,
              amount,
              executedAmount: amount,
              source: 'RATE_ANALYSIS',
              calculationTrace: {
                sorItemCode: rateAnalysis.itemCode,
                boqItemCode: boqItem.itemCode,
                formulaText: traceText,
                lastMeasurementId: measurementRef,
              },
            },
            { upsert: true, new: true }
          );
        }
      } else {
        boqItem.rateAnalysisStatus = 'NOT_AVAILABLE';
      }

      await boqItem.save();
    }

    // 4. Update BOQ Totals
    const boqs = await Boq.find({ companyId: compObjectId, projectId: projObjectId });
    for (const boq of boqs) {
      const stats = await BoqItem.aggregate([
        { $match: { boqId: boq._id } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalBoqValue: { $sum: '$amount' },
          },
        },
      ]);
      const res = stats[0] || { totalItems: 0, totalQuantity: 0, totalBoqValue: 0 };
      await Boq.findByIdAndUpdate(boq._id, {
        totalItems: res.totalItems,
        totalQuantity: Number(res.totalQuantity.toFixed(2)),
        totalBoqValue: Number(res.totalBoqValue.toFixed(2)),
      });
    }

    // 5. Update Project Overall Progress
    const allItems = await BoqItem.find({ companyId: compObjectId, projectId: projObjectId });
    if (allItems.length > 0) {
      const totalAmount = allItems.reduce((s, it) => s + it.amount, 0);
      const executedAmount = allItems.reduce((s, it) => s + (it.executedQuantity * it.rate), 0);
      const overallProgress = totalAmount > 0 ? Number(((executedAmount / totalAmount) * 100).toFixed(0)) : 0;
      await Project.findByIdAndUpdate(projObjectId, { progress: overallProgress });
    }
  }
}
