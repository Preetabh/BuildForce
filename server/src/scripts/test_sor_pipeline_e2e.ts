import mongoose, { Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { env } from '../config/env';
import { SorMaster, SorItem } from '../models/SorMaster';
import { SorImport } from '../models/SorImport';
import { SorStagedItem } from '../models/SorStagedItem';
import { SorService } from '../modules/sor/sor.service';
import { Company } from '../models/Company';
import { User } from '../models/User';

async function runE2ETest() {
  console.log('=== STARTING SOR PIPELINE E2E TEST ===');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB:', env.MONGODB_URI);

  // 1. Get company and user
  let company = await Company.findOne({});
  const companyId = company ? company._id.toString() : '6aae1e4dca306ed48ca9ce8b';
  let user = await User.findOne({});
  const userId = user ? user._id.toString() : companyId;

  console.log(`Using Company ID: ${companyId}`);

  // 2. Safely remove ONLY existing corrupt SOR master/items belonging to CPWD SOR 2023
  console.log('\n--- Step 1: Safely purge only old CPWD SOR master data ---');
  const existingMasters = await SorMaster.find({
    companyId: new Types.ObjectId(companyId),
    sorName: { $in: ['Delhi Schedule of Rates (DSR) 2023 - Civil', 'CPWD SOR 2023', 'CPWD DSR 2023'] },
  });

  for (const m of existingMasters) {
    const itDel = await SorItem.deleteMany({ sorId: m._id });
    console.log(`Deleted ${itDel.deletedCount} old items for master ${m._id} (${m.sorName})`);
    await SorMaster.deleteOne({ _id: m._id });
  }

  const impDel = await SorImport.deleteMany({ companyId: new Types.ObjectId(companyId) });
  const stagedDel = await SorStagedItem.deleteMany({ companyId: new Types.ObjectId(companyId) });
  console.log(`Cleaned ${impDel.deletedCount} old imports and ${stagedDel.deletedCount} staged items.`);

  // 3. Prepare upload file
  console.log('\n--- Step 2: Upload and initiate Excel import ---');
  const sourceExcelPath = 'G:/civil_guruji/server/uploads/sor_temp/sor_79f4423c-f97a-4f6a-b96f-415b067f35eb.xlsx';
  if (!fs.existsSync(sourceExcelPath)) {
    throw new Error(`Source Excel not found at: ${sourceExcelPath}`);
  }

  // Create a copy in temp upload dir
  const tempUploadDir = path.resolve(process.cwd(), 'uploads/sor_temp');
  if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });
  const testFilePath = path.join(tempUploadDir, `test_sor_upload_${Date.now()}.xlsx`);
  fs.copyFileSync(sourceExcelPath, testFilePath);

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'CPWD_SOR_2023.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: fs.statSync(testFilePath).size,
    destination: tempUploadDir,
    filename: path.basename(testFilePath),
    path: testFilePath,
    buffer: Buffer.from([]),
    stream: null as any,
  };

  const sorImport = await SorService.initiateImport(companyId, userId, mockFile, {
    authority: 'CPWD',
    scheduleName: 'CPWD SOR 2023',
    version: '2023',
    effectiveDate: '2023-10-01',
    forceReimport: true,
  });

  console.log(`Import session created: ${sorImport._id}, Status: ${sorImport.status}`);

  // Process Excel synchronously
  await SorService.startBackgroundProcessing(sorImport._id.toString());

  const processedImport = await SorImport.findById(sorImport._id);
  console.log(`After background processing: Status=${processedImport?.status}, ExtractedRows=${processedImport?.progress.rowsExtracted}`);

  if (processedImport?.progress.rowsExtracted !== 4060) {
    throw new Error(`Expected 4060 rows extracted, but got: ${processedImport?.progress.rowsExtracted}`);
  }

  // 4. Publish import to master
  console.log('\n--- Step 3: Publish import to active Rate Master ---');
  const publishResult = await SorService.publishImport(companyId, userId, sorImport._id.toString());
  console.log('Publish result:', publishResult.message);

  const publishedMaster = await SorMaster.findById(publishResult.sorMaster._id);
  const totalItemsCount = await SorItem.countDocuments({ sorId: publishedMaster?._id });
  console.log(`Published Master ID: ${publishedMaster?._id}, Total SorItems: ${totalItemsCount}`);

  if (totalItemsCount !== 4060) {
    throw new Error(`Expected exactly 4060 SorItems in DB, got: ${totalItemsCount}`);
  }

  // 5. Verification of acceptance test items
  console.log('\n--- Step 4: Verification of Test Items (2.1.1 and 2.2.1) ---');
  const item211 = await SorItem.findOne({ sorId: publishedMaster?._id, itemCode: '2.1.1' }).lean();
  console.log('Test Item 2.1.1 in DB:');
  console.log({
    srNo: item211?.srNo,
    itemCode: item211?.itemCode,
    description: item211?.descriptionEnglish,
    unit: item211?.unit,
    rate: item211?.rate,
    workCategory: item211?.workCategory,
    chapter: item211?.chapter,
  });

  if (
    item211?.itemCode !== '2.1.1' ||
    item211?.descriptionEnglish !== 'All kinds of soil' ||
    item211?.unit !== 'SQM' ||
    item211?.rate !== 129.85 ||
    item211?.workCategory !== 'EARTH WORK'
  ) {
    throw new Error(`Item 2.1.1 validation failed! Mismatch in values.`);
  }

  const item221 = await SorItem.findOne({ sorId: publishedMaster?._id, itemCode: '2.2.1' }).lean();
  console.log('\nTest Item 2.2.1 in DB:');
  console.log({
    srNo: item221?.srNo,
    itemCode: item221?.itemCode,
    description: item221?.descriptionEnglish,
    unit: item221?.unit,
    rate: item221?.rate,
    workCategory: item221?.workCategory,
    chapter: item221?.chapter,
  });

  if (
    item221?.itemCode !== '2.2.1' ||
    item221?.descriptionEnglish !== 'All kinds of soil' ||
    item221?.unit !== 'CUM' ||
    item221?.rate !== 395.3 ||
    item221?.workCategory !== 'EARTH WORK'
  ) {
    throw new Error(`Item 2.2.1 validation failed! Mismatch in values.`);
  }

  // Check sub-head 2.1 (rate 0, unit empty)
  const item21 = await SorItem.findOne({ sorId: publishedMaster?._id, itemCode: '2.1' }).lean();
  console.log('\nTest Parent Item 2.1 in DB:');
  console.log({
    srNo: item21?.srNo,
    itemCode: item21?.itemCode,
    unit: item21?.unit,
    rate: item21?.rate,
    workCategory: item21?.workCategory,
  });

  if (item21?.rate !== 0 || item21?.unit !== '') {
    throw new Error(`Item 2.1 validation failed: expected unit="" and rate=0.`);
  }

  // 6. Test Smart Search API
  console.log('\n--- Step 5: Test Smart Search ---');
  const searchResult = await SorService.smartSearchSorItems(companyId, { search: '2.1.1' });
  console.log(`Smart Search for "2.1.1" found ${searchResult.items.length} items. First item code: ${searchResult.items[0]?.itemCode}`);
  if (searchResult.items[0]?.itemCode !== '2.1.1' || searchResult.items[0]?.rate !== 129.85) {
    throw new Error('Smart Search test failed');
  }

  // 7. Test Export and Round-Trip
  console.log('\n--- Step 6: Test Export and Round-Trip Validation ---');
  const exportResult = await SorService.exportSorItems(companyId, publishedMaster?._id.toString());
  console.log(`Export produced file: ${exportResult.fileName}, size: ${exportResult.buffer.length} bytes`);

  const exportWb = XLSX.read(exportResult.buffer, { type: 'buffer' });
  const exportSheet = exportWb.Sheets[exportWb.SheetNames[0]];
  const exportedRows: any[][] = XLSX.utils.sheet_to_json(exportSheet, { header: 1, blankrows: false });

  console.log(`Exported rows count (including header): ${exportedRows.length}`);
  console.log(`Header row:`, exportedRows[0]);
  console.log(`First data row:`, exportedRows[1]);
  console.log(`Second data row (2.1.1):`, exportedRows[2]);

  if (exportedRows.length !== 4061) {
    throw new Error(`Expected 4061 rows in exported Excel (1 header + 4060 items), got ${exportedRows.length}`);
  }

  // Check header
  const expectedHeader = ['SR', 'SR NO', 'WORK DESCRIPTION', 'UNIT', 'RATE', 'TYPE'];
  for (let h = 0; h < expectedHeader.length; h++) {
    if (exportedRows[0][h] !== expectedHeader[h]) {
      throw new Error(`Header mismatch at column ${h}: expected ${expectedHeader[h]}, got ${exportedRows[0][h]}`);
    }
  }

  // Check round-trip match on row 2 (2.1.1)
  const exp211 = exportedRows[2];
  if (exp211[1] !== '2.1.1' || exp211[2] !== 'All kinds of soil' || exp211[3] !== 'SQM' || Number(exp211[4]) !== 129.85 || exp211[5] !== 'EARTH WORK') {
    throw new Error(`Exported 2.1.1 row does not match: ${JSON.stringify(exp211)}`);
  }

  // 8. Test Schedule Hierarchy API
  console.log('\n--- Step 7: Test Schedule Hierarchy ---');
  const hierarchy = await SorService.getScheduleHierarchy(companyId);
  console.log('Active schedule hierarchy items:', hierarchy.length);
  const cpwdSchedule = hierarchy.find((h) => h.sorName === 'CPWD SOR 2023');
  console.log('CPWD SOR 2023 in hierarchy:', cpwdSchedule);

  if (!cpwdSchedule || cpwdSchedule.itemCount !== 4060) {
    throw new Error(`Hierarchy test failed: expected CPWD SOR 2023 with 4060 items, got: ${JSON.stringify(cpwdSchedule)}`);
  }

  console.log('\n=== ALL E2E PIPELINE & ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===');
  await mongoose.disconnect();
}

runE2ETest().catch((err) => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
