import mongoose from 'mongoose';
import { CalculationEngine } from '../modules/engine/calculation.engine';
import { UnitDimensionEngine } from '../modules/engine/unit.validator';
import { MeasurementService } from '../modules/measurements/measurement.service';
import { SorItem } from '../models/SorMaster';
import { Boq, BoqItem } from '../models/Boq';
import { Project } from '../models/Project';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Measurement } from '../models/Measurement';
import { BomItem } from '../models/Bom';
import { ManpowerItem } from '../models/Manpower';
import { MachineryItem } from '../models/Machinery';

async function runUnitDimensionalTests() {
  console.log('================================================================');
  console.log('STRICT MEASUREMENT UNIT & DIMENSIONAL ENGINE VERIFICATION SUITE');
  console.log('================================================================\n');

  // TEST 1: Volume Calculation & Unit Correctness (10m x 10m x 10m -> 1000 m³)
  console.log('--- TEST 1: Volume Calculation 10m × 10m × 10m -> 1000 m³ ---');
  const volResult = CalculationEngine.calculateQuantity(
    'LxWxH',
    { nos: 1, length: 10, width: 10, height: 10 },
    'cum',
    '4.1.3'
  );

  console.log(`Calculated Quantity: ${volResult.calculatedQuantity}`);
  console.log(`Canonical Unit: ${volResult.canonicalUnit}`);
  console.log(`Formula Expression: ${volResult.formulaExpression}`);

  if (volResult.calculatedQuantity !== 1000) {
    throw new Error(`FAIL: Expected 1000, got ${volResult.calculatedQuantity}`);
  }
  if (volResult.canonicalUnit !== 'm³') {
    throw new Error(`FAIL: Expected canonical unit 'm³', got '${volResult.canonicalUnit}'`);
  }
  if (volResult.formulaExpression.includes('mm')) {
    throw new Error(`FAIL: Volume formula expression contains 'mm'! "${volResult.formulaExpression}"`);
  }

  // TEST 2: Rate Display Formatting (Never ₹294/mm)
  console.log('\n--- TEST 2: Rate Display Formatting (Never ₹294/mm) ---');
  const rateDisplayVolume = UnitDimensionEngine.formatRateWithUnit(294, 'cum', 'LxWxH');
  console.log(`Rate for 294 with 'cum': ${rateDisplayVolume}`);
  if (rateDisplayVolume.includes('/ mm') || rateDisplayVolume.includes('/ mm')) {
    throw new Error(`FAIL: Rate display formatted as mm! "${rateDisplayVolume}"`);
  }
  if (!rateDisplayVolume.includes('m³')) {
    throw new Error(`FAIL: Rate display should show '/ m³', got "${rateDisplayVolume}"`);
  }

  const rateDisplayArea = UnitDimensionEngine.formatRateWithUnit(245, 'sqm', 'LxW');
  console.log(`Rate for 245 with 'sqm': ${rateDisplayArea}`);
  if (!rateDisplayArea.includes('m²')) {
    throw new Error(`FAIL: Rate display should show '/ m²', got "${rateDisplayArea}"`);
  }

  // TEST 3: Strict Rejection of Incompatible Dimensions (DATA_CONFIGURATION_ERROR)
  console.log('\n--- TEST 3: Strict Rejection of Incompatible Dimensions ---');
  let threwForMmVolume = false;
  try {
    CalculationEngine.calculateQuantity(
      'LxWxH',
      { nos: 1, length: 10, width: 10, height: 10 },
      'mm', // Incompatible: mm is linear, LxWxH is volume
      'TEST-ITEM'
    );
  } catch (err: any) {
    threwForMmVolume = true;
    console.log(`✓ Caught Expected Error for LxWxH + mm: "${err.message}"`);
  }
  if (!threwForMmVolume) {
    throw new Error('FAIL: Engine failed to reject LxWxH volume formula with unit mm!');
  }

  let threwForSqmVolume = false;
  try {
    CalculationEngine.calculateQuantity(
      'LxWxH',
      { nos: 1, length: 10, width: 10, height: 10 },
      'sqm', // Incompatible: sqm is area, LxWxH is volume
      'TEST-ITEM'
    );
  } catch (err: any) {
    threwForSqmVolume = true;
    console.log(`✓ Caught Expected Error for LxWxH + sqm: "${err.message}"`);
  }
  if (!threwForSqmVolume) {
    throw new Error('FAIL: Engine failed to reject LxWxH volume formula with unit sqm!');
  }

  // TEST 4: Area Calculation (10m x 5m -> 50 m²)
  console.log('\n--- TEST 4: Area Calculation (10m x 5m -> 50 m²) ---');
  const areaResult = CalculationEngine.calculateQuantity(
    'LxW',
    { nos: 1, length: 10, width: 5 },
    'sqm',
    '13.1.1'
  );
  console.log(`Area Quantity: ${areaResult.calculatedQuantity} ${areaResult.canonicalUnit}`);
  console.log(`Area Expression: ${areaResult.formulaExpression}`);
  if (areaResult.calculatedQuantity !== 50 || areaResult.canonicalUnit !== 'm²') {
    throw new Error(`FAIL: Expected 50 m², got ${areaResult.calculatedQuantity} ${areaResult.canonicalUnit}`);
  }

  // Connect to MongoDB for End-to-End Database Validation
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');

  let company = await Company.findOne({});
  let user = await User.findOne({});
  if (!company || !user) {
    throw new Error('Company or User not found in DB');
  }

  // TEST 5: BOQ Excess Quantity Rule Enforcement (Do Not Bypass)
  console.log('\n--- TEST 5: BOQ Excess Quantity Business Rule Enforcement ---');
  const testProject = await Project.create({
    companyId: company._id,
    name: `TEST-UNIT-PROJECT-${Date.now()}`,
    code: `TUP-${Date.now()}`,
    projectType: 'Commercial',
    status: 'active',
    createdBy: user._id,
  });

  const testBoq = await Boq.create({
    companyId: company._id,
    projectId: testProject._id,
    title: 'Contract BOQ',
    version: '1.0',
    status: 'Approved',
    createdBy: user._id,
  });

  // Create contract BOQ item with quantity 12 cum, allowExcessQuantity: false
  const fixedBoqItem = await BoqItem.create({
    companyId: company._id,
    projectId: testProject._id,
    boqId: testBoq._id,
    itemNumber: 1,
    itemCode: '4.1.3-CONTRACT',
    description: 'PCC 1:2:4 in Foundation (Contract Limit 12 cum)',
    unit: 'cum',
    quantity: 12,
    rate: 5850,
    amount: 70200,
    executedQuantity: 0,
    balanceQuantity: 12,
    progressPercent: 0,
    allowExcessQuantity: false, // Strict contract cap!
    isDerivedFromMeasurement: false, // Contract fixed quantity
  });

  let excessBlocked = false;
  try {
    // Attempting to record 1000 cum measurement for a 12 cum contract item
    await MeasurementService.addMeasurementEntry(
      company._id.toString(),
      testProject._id.toString(),
      user._id.toString(),
      {
        boqItemId: fixedBoqItem._id.toString(),
        description: 'Over-limit pour test',
        formula: 'LxWxH',
        nos: 1,
        length: 10,
        width: 10,
        heightDepth: 10, // 1000 cum!
        unit: 'cum',
      }
    );
  } catch (err: any) {
    excessBlocked = true;
    console.log(`✓ Caught Expected Excess Quantity Block: "${err.message}"`);
  }

  if (!excessBlocked) {
    throw new Error('FAIL: MeasurementService failed to enforce strict BOQ limit when allowExcessQuantity is false!');
  }

  // TEST 6: Valid Measurement Within BOQ Limit (10m x 4m x 0.15m = 6 cum <= 12 cum)
  console.log('\n--- TEST 6: Valid Measurement Within Limit (6 cum <= 12 cum) ---');
  const validMeas = await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      boqItemId: fixedBoqItem._id.toString(),
      description: 'First valid pour (6 cum)',
      formula: 'LxWxH',
      nos: 1,
      length: 10,
      width: 4,
      heightDepth: 0.15,
      unit: 'cum',
    }
  );

  console.log(`✓ Valid measurement recorded: ${validMeas._id} (Qty: ${validMeas.totalQuantity} cum)`);
  const updatedBoqItem = await BoqItem.findById(fixedBoqItem._id);
  console.log(`✓ Updated BOQ Executed: ${updatedBoqItem?.executedQuantity} cum / Planned: ${updatedBoqItem?.quantity} cum (Balance: ${updatedBoqItem?.balanceQuantity} cum)`);

  if (updatedBoqItem?.executedQuantity !== 6 || updatedBoqItem?.balanceQuantity !== 6) {
    throw new Error(`FAIL: Expected executed 6 and balance 6, got executed ${updatedBoqItem?.executedQuantity} and balance ${updatedBoqItem?.balanceQuantity}`);
  }

  // Clean up test project
  await Project.deleteOne({ _id: testProject._id });
  await Boq.deleteOne({ projectId: testProject._id });
  await BoqItem.deleteMany({ projectId: testProject._id });
  await Measurement.deleteMany({ projectId: testProject._id });
  await BomItem.deleteMany({ projectId: testProject._id });
  await ManpowerItem.deleteMany({ projectId: testProject._id });
  await MachineryItem.deleteMany({ projectId: testProject._id });

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log('✅ ALL UNIT & DIMENSIONAL TESTS PASSED 100% WITH ABSOLUTE INTEGRITY!');
  console.log('================================================================');
}

runUnitDimensionalTests().catch((err) => {
  console.error('❌ Test suite failed with error:', err);
  process.exit(1);
});
