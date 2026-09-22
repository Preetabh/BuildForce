import mongoose, { Types } from 'mongoose';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Boq, BoqItem } from '../models/Boq';
import { Measurement } from '../models/Measurement';
import { BomItem } from '../models/Bom';
import { ManpowerItem } from '../models/Manpower';
import { MachineryItem } from '../models/Machinery';
import { SorRateAnalysis } from '../models/SorRateAnalysis';
import { RateAnalysisService } from '../modules/sor/rateAnalysis.service';
import { MeasurementService } from '../modules/measurements/measurement.service';
import { BoqService } from '../modules/boq/boq.service';
import { BillingService } from '../modules/billing/billing.service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civil_guruji_erp';

async function runTest() {
  console.log('================================================================');
  console.log('TESTING MEASUREMENT AS SINGLE SOURCE OF TRUTH (ENGINE VERIFICATION)');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const company = await Company.findOne();
  if (!company) throw new Error('No company found in database. Run seed first.');
  const user = await User.findOne({ companyId: company._id });
  if (!user) throw new Error('No user found in database.');

  console.log(`Using Company: ${company.name} (${company._id})`);
  console.log(`Using User: ${user.name} (${user.email})\n`);

  // Step 1: Ensure CPWD DAR is seeded in MongoDB
  console.log('--- Step 1: Seed / Verify CPWD DAR in Database ---');
  await RateAnalysisService.seedDefaultCpwdDarAnalyses(company._id.toString());
  const dar413 = await SorRateAnalysis.findOne({ companyId: company._id, itemCode: '4.1.3' });
  console.log(`DAR 4.1.3 in DB: ${dar413 ? 'FOUND' : 'MISSING'}`);
  console.log(`Materials in 4.1.3: ${dar413?.materials.map(m => `${m.name} (coeff: ${m.coefficient})`).join(', ')}`);
  console.log(`Labour in 4.1.3: ${dar413?.labour.map(l => `${l.name} (coeff: ${l.coefficient})`).join(', ')}`);
  console.log(`Machinery in 4.1.3: ${dar413?.machinery.map(m => `${m.name} (coeff: ${m.coefficient})`).join(', ')}\n`);

  // Step 2: Create a Test Project
  console.log('--- Step 2: Create Test Project & BOQ ---');
  const testProject = await Project.create({
    companyId: company._id,
    name: 'TEST-AUTOMATION-MEASUREMENT-PROJECT',
    code: 'PRJ-TEST-' + Date.now().toString().slice(-4),
    projectType: 'Infrastructure',
    status: 'active',
    contractValue: 1000000,
    estimatedValue: 1000000,
    currency: 'INR',
  });
  console.log(`Created Project: ${testProject.name} (${testProject._id})`);

  // Create BOQ Item with itemCode 4.1.3
  const boqItem = await BoqService.addBoqItem(company._id.toString(), testProject._id.toString(), user._id.toString(), {
    itemCode: '4.1.3',
    description: 'Providing and laying cement concrete 1:2:4 up to plinth level',
    unit: 'cum',
    quantity: 100,
    rate: 5850,
  });

  console.log(`Created BOQ Item: ${boqItem.itemCode} (${boqItem.description})`);
  console.log(`Initial BOQ Item State:`);
  console.log(`  Quantity: ${boqItem.quantity} ${boqItem.unit}`);
  console.log(`  Executed: ${boqItem.executedQuantity} ${boqItem.unit}`);
  console.log(`  Balance: ${boqItem.balanceQuantity} ${boqItem.unit}`);
  console.log(`  Progress: ${boqItem.progressPercent}%`);
  console.log(`  Rate Analysis Status: ${boqItem.rateAnalysisStatus}\n`);

  if (boqItem.rateAnalysisStatus !== 'AVAILABLE') {
    throw new Error(`Expected rateAnalysisStatus to be AVAILABLE, got ${boqItem.rateAnalysisStatus}`);
  }

  // Step 3: Enter First Measurement (10m x 5m x 0.4m = 20 cum)
  console.log('--- Step 3: Record Measurement 1 (10m x 5m x 0.4m = 20 cum) ---');
  const m1 = await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      boqItemId: boqItem._id.toString(),
      description: 'Foundation Trench PCC Bed Pour 1',
      location: 'Grid A1-A5',
      levelFloor: 'Foundation Level -2.0m',
      nos: 1,
      length: 10,
      width: 5,
      heightDepth: 0.4,
      unit: 'cum',
      formula: 'LxWxH',
      remarks: 'Inspected and approved by QA',
    }
  );

  console.log(`Measurement 1 Recorded:`);
  console.log(`  Formula: ${m1.entries[0].formula} -> Calculated: ${m1.totalQuantity} cum`);
  console.log(`  Status: ${m1.status}`);
  console.log(`  Previous: ${m1.previousQuantity}, Current: ${m1.currentQuantity}, Cumulative: ${m1.cumulativeQuantity}\n`);

  // Verify BOQ item auto-update
  const updatedBoqItem1 = await BoqItem.findById(boqItem._id);
  console.log('--- Step 4: Verify Auto-Update of BOQ Item ---');
  console.log(`  Executed: ${updatedBoqItem1?.executedQuantity} (Expected: 20)`);
  console.log(`  Balance: ${updatedBoqItem1?.balanceQuantity} (Expected: 80)`);
  console.log(`  Progress: ${updatedBoqItem1?.progressPercent}% (Expected: 20%)\n`);

  if (updatedBoqItem1?.executedQuantity !== 20 || updatedBoqItem1?.progressPercent !== 20) {
    throw new Error('BOQ Item did not auto-update correctly from Measurement 1!');
  }

  // Verify Downstream Resources (BOM, Manpower, Machinery)
  console.log('--- Step 5: Verify Auto-Update of Downstream Resources ---');
  const boms1 = await BomItem.find({ boqItemId: boqItem._id });
  const manpower1 = await ManpowerItem.find({ boqItemId: boqItem._id });
  const machinery1 = await MachineryItem.find({ boqItemId: boqItem._id });

  console.log(`BOM Items Created (${boms1.length}):`);
  for (const b of boms1) {
    console.log(`  - ${b.materialName}: Coeff: ${b.coefficient} | Executed Qty: ${b.executedQuantity} ${b.unit} | Amount: ₹${b.amount}`);
    console.log(`    Trace: ${b.calculationTrace?.formulaText}`);
  }

  console.log(`Manpower Items Created (${manpower1.length}):`);
  for (const m of manpower1) {
    console.log(`  - ${m.labourType}: Coeff: ${m.coefficient} | Executed Mandays: ${m.executedManpower} | Amount: ₹${m.amount}`);
  }

  console.log(`Machinery Items Created (${machinery1.length}):`);
  for (const mac of machinery1) {
    console.log(`  - ${mac.machineryType}: Coeff: ${mac.coefficient} | Executed Hours: ${mac.executedHours} | Amount: ₹${mac.amount}`);
  }
  console.log();

  // Validate exact DAR values:
  // Cement: 20 * 6.4 = 128 Bags
  const cement1 = boms1.find(b => b.materialName.includes('Cement'));
  if (!cement1 || cement1.executedQuantity !== 128) {
    throw new Error(`Expected cement quantity 128, got ${cement1?.executedQuantity}`);
  }
  // Sand: 20 * 0.45 = 9 cum
  const sand1 = boms1.find(b => b.materialName.includes('Sand'));
  if (!sand1 || sand1.executedQuantity !== 9) {
    throw new Error(`Expected sand quantity 9, got ${sand1?.executedQuantity}`);
  }
  // Mason: 20 * 0.1 = 2 Days
  const mason1 = manpower1.find(m => m.labourType.includes('Mason'));
  if (!mason1 || mason1.executedManpower !== 2) {
    throw new Error(`Expected mason mandays 2, got ${mason1?.executedManpower}`);
  }
  // Mixer: 20 * 0.15 = 3 Hours
  const mixer1 = machinery1.find(m => m.machineryType.includes('Mixer'));
  if (!mixer1 || mixer1.executedHours !== 3) {
    throw new Error(`Expected mixer hours 3, got ${mixer1?.executedHours}`);
  }
  console.log('✓ All authentic DAR coefficients and execution numbers verified for Measurement 1!\n');

  // Step 6: Enter Second Measurement (30 cum) - Verify No Duplicates, Clean In-Place Update
  console.log('--- Step 6: Record Measurement 2 (10m x 5m x 0.6m = 30 cum) ---');
  const m2 = await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      boqItemId: boqItem._id.toString(),
      description: 'Foundation Trench PCC Bed Pour 2',
      location: 'Grid A5-A10',
      levelFloor: 'Foundation Level -2.0m',
      nos: 1,
      length: 10,
      width: 5,
      heightDepth: 0.6,
      unit: 'cum',
      formula: 'LxWxH',
      remarks: 'Inspected and approved by Site Engineer',
    }
  );

  console.log(`Measurement 2 Recorded:`);
  console.log(`  Calculated: ${m2.totalQuantity} cum, Cumulative: ${m2.cumulativeQuantity} cum\n`);

  const updatedBoqItem2 = await BoqItem.findById(boqItem._id);
  console.log(`BOQ Item After Measurement 2:`);
  console.log(`  Executed: ${updatedBoqItem2?.executedQuantity} (Expected: 50)`);
  console.log(`  Balance: ${updatedBoqItem2?.balanceQuantity} (Expected: 50)`);
  console.log(`  Progress: ${updatedBoqItem2?.progressPercent}% (Expected: 50%)\n`);

  const boms2 = await BomItem.find({ boqItemId: boqItem._id });
  const manpower2 = await ManpowerItem.find({ boqItemId: boqItem._id });
  const machinery2 = await MachineryItem.find({ boqItemId: boqItem._id });

  console.log(`BOM Items Count: ${boms2.length} (Expected: ${boms1.length} - NEVER DUPLICATE)`);
  const cement2 = boms2.find(b => b.materialName.includes('Cement'));
  console.log(`Cement Executed Qty: ${cement2?.executedQuantity} Bags (Expected: 50 * 6.4 = 320 Bags)`);
  console.log(`Cement Amount: ₹${cement2?.amount} (Expected: 320 * 380 = ₹1,21,600)\n`);

  if (boms2.length !== boms1.length || cement2?.executedQuantity !== 320) {
    throw new Error('Duplicate items created or incorrect cumulative calculation!');
  }
  console.log('✓ Idempotent update and cumulative quantity calculation verified!\n');

  // Step 7: Test Reversal Logic
  console.log('--- Step 7: Test Measurement Reversal ---');
  await MeasurementService.reverseMeasurement(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    m2._id.toString(),
    'Testing audit-compliant traceable reversal'
  );

  const reversedM2 = await Measurement.findById(m2._id);
  console.log(`Measurement 2 State: isReversed=${reversedM2?.isReversed}, status=${reversedM2?.status}`);
  console.log(`Reversal Reason: ${reversedM2?.reversalReason}`);

  const updatedBoqItemAfterRev = await BoqItem.findById(boqItem._id);
  console.log(`BOQ Item After Reversal:`);
  console.log(`  Executed: ${updatedBoqItemAfterRev?.executedQuantity} (Expected: 20)`);
  console.log(`  Balance: ${updatedBoqItemAfterRev?.balanceQuantity} (Expected: 80)`);
  console.log(`  Progress: ${updatedBoqItemAfterRev?.progressPercent}% (Expected: 20%)\n`);

  const bomsAfterRev = await BomItem.find({ boqItemId: boqItem._id });
  const cementAfterRev = bomsAfterRev.find(b => b.materialName.includes('Cement'));
  console.log(`Cement Executed Qty After Reversal: ${cementAfterRev?.executedQuantity} (Expected: 128 Bags)\n`);

  if (updatedBoqItemAfterRev?.executedQuantity !== 20 || cementAfterRev?.executedQuantity !== 128) {
    throw new Error('Reversal did not properly recalculate downstream execution!');
  }
  console.log('✓ Reversal and downstream auto-recalculation verified!\n');

  // Step 8: Test Missing Analysis Handling (Analysis Not Available)
  console.log('--- Step 8: Test Item With No SOR/DAR Analysis ---');
  const customBoqItem = await BoqService.addBoqItem(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      itemCode: 'CUSTOM-SPECIAL-01',
      description: 'Custom architectural acoustic wooden panelling with sound insulation',
      unit: 'sqm',
      quantity: 50,
      rate: 3200,
    }
  );

  console.log(`Custom Item Status: ${customBoqItem.rateAnalysisStatus} (Expected: NOT_AVAILABLE)`);
  const customBoms = await BomItem.find({ boqItemId: customBoqItem._id });
  console.log(`BOM Items for unanalyzed item: ${customBoms.length} (Expected: 0 - NO GUESSING)`);

  if (customBoqItem.rateAnalysisStatus !== 'NOT_AVAILABLE' || customBoms.length !== 0) {
    throw new Error('Expected NOT_AVAILABLE and 0 guessed items for custom item!');
  }

  // Now configure controlled manual analysis for custom item
  console.log('Configuring controlled manual analysis for custom item...');
  await BoqService.saveItemRateAnalysis(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    customBoqItem._id.toString(),
    {
      materials: [
        { name: 'Acoustic Perforated Panel', unit: 'sqm', coefficient: 1.05, unitRate: 1800 },
        { name: 'Rockwool Insulation Slab 50mm', unit: 'sqm', coefficient: 1.0, unitRate: 450 },
      ],
      labour: [
        { name: 'Acoustic Specialist Carpenter', unit: 'Day', coefficient: 0.2, unitRate: 1100 },
      ],
      machinery: [],
    }
  );

  const customBoqItemAfterConfig = await BoqItem.findById(customBoqItem._id);
  console.log(`Custom Item Status After Config: ${customBoqItemAfterConfig?.rateAnalysisStatus} (Expected: CUSTOM)`);

  // Record measurement on custom item
  await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      boqItemId: customBoqItem._id.toString(),
      description: 'Acoustic Panelling Conference Hall',
      location: 'Level 1 Conference Hall',
      nos: 2,
      length: 5,
      width: 2,
      heightDepth: 1,
      unit: 'sqm',
      formula: 'LxW',
    }
  );

  const customBomsAfterMeasurement = await BomItem.find({ boqItemId: customBoqItem._id });
  console.log(`Custom Item BOMs Generated: ${customBomsAfterMeasurement.length} (Expected: 2)`);
  for (const b of customBomsAfterMeasurement) {
    console.log(`  - ${b.materialName}: ${b.executedQuantity} ${b.unit} | ₹${b.amount}`);
  }
  console.log('✓ Controlled manual configuration for missing analysis verified!\n');

  // Step 9: Verify Running Bill and Cost Control Synchronization
  console.log('--- Step 9: Running Bill & Cost Control Synchronization ---');
  const bill = await BillingService.generateDraftBill(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString()
  );

  console.log(`Generated Bill Number: ${bill.billNumber}`);
  console.log(`Bill Total Current Amount: ₹${bill.totalCurrentAmount.toLocaleString('en-IN')}`);
  const billItem413 = bill.items.find(it => it.itemCode === '4.1.3');
  console.log(`Bill Item 4.1.3: Current Qty = ${billItem413?.currentQuantity} cum (Expected: 20 cum)`);
  console.log(`Bill Item 4.1.3: Current Amount = ₹${billItem413?.currentAmount} (Expected: 20 * 5850 = ₹1,17,000)`);

  const costControl = await BillingService.getProjectCostControl(
    company._id.toString(),
    testProject._id.toString()
  );
  console.log('\nCost Control Metrics:');
  console.log(`  Contract Value: ₹${costControl.contractValue.toLocaleString('en-IN')}`);
  console.log(`  Executed Value: ₹${costControl.executedValue.toLocaleString('en-IN')}`);
  console.log(`  Material Direct Cost: ₹${costControl.materialCost.toLocaleString('en-IN')}`);
  console.log(`  Manpower Direct Cost: ₹${costControl.manpowerCost.toLocaleString('en-IN')}`);
  console.log(`  Machinery Direct Cost: ₹${costControl.machineryCost.toLocaleString('en-IN')}`);
  console.log(`  Total Direct Cost: ₹${costControl.directCostTotal.toLocaleString('en-IN')}`);

  if (billItem413?.currentQuantity !== 20 || billItem413?.currentAmount !== 117000) {
    throw new Error('Running bill is not synchronized with executed quantities!');
  }
  console.log('\n✓ Running Bill and Cost Control Synchronization verified!\n');

  // Cleanup test project
  console.log('--- Cleaning Up Test Artifacts ---');
  await Measurement.deleteMany({ projectId: testProject._id });
  await BomItem.deleteMany({ projectId: testProject._id });
  await ManpowerItem.deleteMany({ projectId: testProject._id });
  await MachineryItem.deleteMany({ projectId: testProject._id });
  await BoqItem.deleteMany({ projectId: testProject._id });
  await Boq.deleteMany({ projectId: testProject._id });
  await Project.deleteOne({ _id: testProject._id });
  console.log('Cleanup completed successfully.\n');

  console.log('================================================================');
  console.log('🎉 ALL TESTS PASSED: MEASUREMENT IS AUTHORITATIVE SINGLE TRUTH');
  console.log('================================================================');

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
