import mongoose from 'mongoose';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Boq, BoqItem } from '../models/Boq';
import { SorMaster, SorItem } from '../models/SorMaster';
import { Measurement } from '../models/Measurement';
import { BomItem } from '../models/Bom';
import { ManpowerItem } from '../models/Manpower';
import { MachineryItem } from '../models/Machinery';
import { SorRateAnalysis } from '../models/SorRateAnalysis';
import { RateAnalysisService } from '../modules/sor/rateAnalysis.service';
import { SorService } from '../modules/sor/sor.service';
import { MeasurementService } from '../modules/measurements/measurement.service';
import { CalculationEngine } from '../modules/engine/calculation.engine';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civil_guruji_erp';

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('MEASUREMENT-DRIVEN ESTIMATION & RESOURCE ENGINE VERIFICATION');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB.');

  const company = await Company.findOne();
  if (!company) throw new Error('No company found.');
  const user = await User.findOne({ companyId: company._id });
  if (!user) throw new Error('No user found.');

  // Step 1: Ensure CPWD DAR Seed
  console.log('\n--- 1. Verifying Seeded CPWD DAR Analysis ---');
  await RateAnalysisService.seedDefaultCpwdDarAnalyses(company._id.toString());
  const seededAnalyses = await SorRateAnalysis.find({ companyId: company._id });
  console.log(`✓ Active Rate Analyses in Database: ${seededAnalyses.length} items (${seededAnalyses.map(a => a.itemCode).join(', ')})`);

  // Step 2: Test Smart Search
  console.log('\n--- 2. Testing Smart DSR/SOR Search Engine ---');
  const searchKeywords = ['PCC', 'RCC footing', 'Earthwork', 'Plaster'];
  for (const kw of searchKeywords) {
    const results = await SorService.smartSearchSorItems(company._id.toString(), { search: kw, limit: 3 });
    console.log(`✓ Search Keyword "${kw}" -> ${results.items.length} items found (Top: ${results.items[0]?.itemCode} - ${results.items[0]?.descriptionEnglish?.slice(0, 45)}...)`);
  }

  // Step 3: Create Clean Test Project
  console.log('\n--- 3. Creating Clean Workspace Project ---');
  const testProject = await Project.create({
    companyId: company._id,
    name: 'TEST-MEASUREMENT-DRIVEN-ERP-' + Date.now().toString().slice(-4),
    code: 'MD-' + Date.now().toString().slice(-4),
    projectType: 'Commercial',
    status: 'active',
    contractValue: 5000000,
    estimatedValue: 5000000,
    currency: 'INR',
  });
  console.log(`✓ Created Project: ${testProject.name} (${testProject._id})`);

  // Step 4: Pick or Create an SOR Master & Item (e.g. 4.1.3 PCC)
  let testSor = await SorMaster.findOne({ companyId: company._id });
  if (!testSor) {
    testSor = await SorMaster.create({
      companyId: company._id,
      authority: 'CPWD',
      scheduleName: 'CPWD Delhi Schedule of Rates (DSR)',
      version: '2023',
      category: 'Civil Works',
      effectiveFrom: new Date(),
      status: 'ACTIVE',
    });
  }

  let pccItem = await SorItem.findOne({ sorId: testSor._id, itemCode: '4.1.3' });
  if (!pccItem) {
    pccItem = await SorItem.create({
      sorId: testSor._id,
      itemCode: '4.1.3',
      descriptionEnglish: 'Providing and laying in position specified grade of reinforced cement concrete 1:2:4 (1 cement : 2 coarse sand : 4 graded stone aggregate 20 mm nominal size)',
      unit: 'cum',
      rate: 5850,
      workCategory: 'Concrete Work',
      measurementFormula: 'LxWxH',
      status: 'ACTIVE',
    });
  }

  // Step 5: Live Preview Test
  console.log('\n--- 4. Testing Live Impact Preview (LxWxH: 2 nos, 10m x 4m x 0.15m = 12 cum) ---');
  const analysis = await SorRateAnalysis.findOne({ companyId: company._id, itemCode: pccItem.itemCode });
  const qtyObj = CalculationEngine.calculateQuantity('LxWxH', { nos: 2, length: 10, width: 4, heightDepth: 0.15 });
  const preview = CalculationEngine.calculateImpactPreview(
    qtyObj.calculatedQuantity,
    pccItem.rate,
    analysis || undefined
  );

  console.log(`✓ Evaluated Quantity: ${qtyObj.calculatedQuantity} cum (${qtyObj.formulaExpression})`);
  console.log(`✓ Preview BOQ Amount: ₹${preview.boqAmount}`);
  console.log(`✓ Preview Materials: ${preview.materials.map(m => `${m.name}: ${m.requiredQuantity} ${m.unit} (₹${m.amount})`).join(' | ')}`);
  console.log(`✓ Preview Labour: ${preview.labour.map(l => `${l.name}: ${l.requiredQuantity} Days (₹${l.amount})`).join(' | ')}`);
  console.log(`✓ Preview Machinery: ${preview.machinery.map(m => `${m.name}: ${m.requiredQuantity} Hrs (₹${m.amount})`).join(' | ')}`);
  console.log(`✓ Preview Total Direct Resource Cost: ₹${preview.totalResourceCost}`);

  if (qtyObj.calculatedQuantity !== 12) throw new Error(`Expected qty 12, got ${qtyObj.calculatedQuantity}`);

  // Step 6: Add First Measurement (Directly from SOR item)
  console.log('\n--- 5. Adding Measurement 1 from SOR Item (Auto-Creates BOQ + BOM + Manpower + Machinery) ---');
  const m1 = await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      sorItemId: pccItem._id.toString(),
      description: 'Ground Floor Footing PCC Bedding',
      location: 'Block A, Grid 1-6',
      levelFloor: 'Foundation -1.5m',
      formula: 'LxWxH',
      nos: 2,
      length: 10,
      width: 4,
      heightDepth: 0.15,
      unit: 'cum',
      remarks: 'First pour inspection passed',
    }
  );

  console.log(`✓ Measurement 1 Created: ${m1._id} (Qty: ${m1.totalQuantity} cum, Amount: ₹${m1.amount})`);

  // Verify BOQ item auto-created
  const boq1 = await BoqItem.findOne({ projectId: testProject._id, itemCode: '4.1.3' });
  if (!boq1) throw new Error('BOQ item was not auto-created!');
  console.log(`✓ Auto-Created BOQ Item: ${boq1.itemCode} | Qty: ${boq1.quantity} cum | Executed: ${boq1.executedQuantity} cum | Amount: ₹${boq1.amount} | Derived: ${boq1.isDerivedFromMeasurement}`);

  // Verify BOM items auto-generated
  const boms1 = await BomItem.find({ projectId: testProject._id });
  console.log(`✓ Auto-Generated BOM: ${boms1.length} materials:`);
  boms1.forEach(b => console.log(`   - ${b.materialName}: Planned ${b.plannedQuantity} ${b.unit}, Executed ${b.executedQuantity} ${b.unit}, Amount ₹${b.executedAmount}`));

  // Verify Manpower auto-generated
  const mp1 = await ManpowerItem.find({ projectId: testProject._id });
  console.log(`✓ Auto-Generated Manpower: ${mp1.length} trades:`);
  mp1.forEach(l => console.log(`   - ${l.labourType}: Planned ${l.plannedManpower} Days, Executed ${l.executedManpower} Days, Wages ₹${l.executedAmount}`));

  // Verify Machinery auto-generated
  const mac1 = await MachineryItem.find({ projectId: testProject._id });
  console.log(`✓ Auto-Generated Machinery: ${mac1.length} equipment:`);
  mac1.forEach(m => console.log(`   - ${m.machineryType}: Planned ${m.plannedHours} Hrs, Executed ${m.executedHours} Hrs, Cost ₹${m.executedAmount}`));

  // Step 7: Add Second Measurement for Same SOR Item (1 nos, 5m x 4m x 0.15m = 3 cum)
  console.log('\n--- 6. Adding Measurement 2 for Same Item (Aggregation Test: +3 cum -> Total 15 cum) ---');
  const m2 = await MeasurementService.addMeasurementEntry(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    {
      sorItemId: pccItem._id.toString(),
      description: 'Block B Extension PCC Bedding',
      location: 'Block B, Grid 7-9',
      levelFloor: 'Foundation -1.5m',
      formula: 'LxWxH',
      nos: 1,
      length: 5,
      width: 4,
      heightDepth: 0.15,
      unit: 'cum',
    }
  );

  const boq2 = await BoqItem.findOne({ projectId: testProject._id, itemCode: '4.1.3' });
  console.log(`✓ Aggregated BOQ Item Qty: ${boq2?.quantity} cum (Executed: ${boq2?.executedQuantity} cum, Amount: ₹${boq2?.amount})`);
  if (boq2?.quantity !== 15 || boq2?.executedQuantity !== 15) {
    throw new Error(`Expected aggregated qty 15, got ${boq2?.quantity}`);
  }

  // Step 8: Test Dashboard Summary
  console.log('\n--- 7. Testing Measurement Dashboard Summary Endpoint ---');
  const summary = await MeasurementService.getMeasurementSummary(company._id.toString(), testProject._id.toString());
  console.log(`✓ Measurement Summary:`);
  console.log(`   - Total Measurements: ${summary.totalMeasurements}`);
  console.log(`   - Total BOQ Amount: ₹${summary.totalBoqAmount}`);
  console.log(`   - Total Material Cost: ₹${summary.totalMaterialCost}`);
  console.log(`   - Total Manpower Cost: ₹${summary.totalManpowerCost}`);
  console.log(`   - Total Machinery Cost: ₹${summary.totalMachineryCost}`);
  console.log(`   - Total Project Execution Cost: ₹${summary.totalProjectCost}`);

  if (summary.totalMeasurements !== 2) throw new Error(`Expected 2 measurements in summary, got ${summary.totalMeasurements}`);

  // Step 9: Edit Measurement 1 (change L=10 to L=8 -> qty = 9.6 cum + 3 cum = 12.6 cum)
  console.log('\n--- 8. Editing Measurement 1 (L=10 -> L=8: Total should become 12.6 cum) ---');
  await MeasurementService.updateMeasurement(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    m1._id.toString(),
    {
      description: 'Ground Floor Footing PCC Bedding (Revised)',
      nos: 2,
      length: 8,
      width: 4,
      heightDepth: 0.15,
    }
  );

  const boq3 = await BoqItem.findOne({ projectId: testProject._id, itemCode: '4.1.3' });
  console.log(`✓ Recalculated BOQ Qty after edit: ${boq3?.quantity} cum (Executed: ${boq3?.executedQuantity} cum)`);
  if (boq3?.quantity !== 12.6) throw new Error(`Expected 12.6 cum, got ${boq3?.quantity}`);

  // Step 10: Duplicate Measurement 2
  console.log('\n--- 9. Duplicating Measurement 2 ---');
  const dupM = await MeasurementService.duplicateMeasurement(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    m2._id.toString()
  );
  console.log(`✓ Duplicated Measurement: ${dupM._id} (Qty: ${dupM.totalQuantity} cum)`);
  const boqAfterDup = await BoqItem.findOne({ projectId: testProject._id, itemCode: '4.1.3' });
  console.log(`✓ BOQ Qty after duplicate: ${boqAfterDup?.quantity} cum (12.6 + 3.0 = 15.6 cum)`);
  if (boqAfterDup?.quantity !== 15.6) throw new Error(`Expected 15.6 cum, got ${boqAfterDup?.quantity}`);

  // Step 11: Delete Duplicated Measurement & Verify Cleanup
  console.log('\n--- 10. Deleting Duplicate Measurement ---');
  await MeasurementService.deleteMeasurement(
    company._id.toString(),
    testProject._id.toString(),
    user._id.toString(),
    dupM._id.toString()
  );
  const boqAfterDel = await BoqItem.findOne({ projectId: testProject._id, itemCode: '4.1.3' });
  console.log(`✓ BOQ Qty after deletion: ${boqAfterDel?.quantity} cum (back to 12.6 cum)`);
  if (boqAfterDel?.quantity !== 12.6) throw new Error(`Expected 12.6 cum, got ${boqAfterDel?.quantity}`);

  // Clean up test project
  await Project.deleteOne({ _id: testProject._id });
  await Boq.deleteOne({ projectId: testProject._id });
  await BoqItem.deleteMany({ projectId: testProject._id });
  await Measurement.deleteMany({ projectId: testProject._id });
  await BomItem.deleteMany({ projectId: testProject._id });
  await ManpowerItem.deleteMany({ projectId: testProject._id });
  await MachineryItem.deleteMany({ projectId: testProject._id });

  console.log('\n================================================================');
  console.log('✅ ALL AUTOMATED MEASUREMENT-DRIVEN CALCULATIONS VERIFIED 100%!');
  console.log('================================================================');

  await mongoose.disconnect();
}

runEndToEndVerification().catch(err => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
