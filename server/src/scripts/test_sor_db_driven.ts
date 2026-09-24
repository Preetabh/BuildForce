import mongoose, { Types } from 'mongoose';
import { env } from '../config/env';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { SorMaster, SorItem } from '../models/SorMaster';
import { UserRecentSor } from '../models/UserRecentSor';
import { MasterOption } from '../models/MasterOption';
import { SorService } from '../modules/sor/sor.service';
import { CurrencyUtil } from '../utils/currency';

async function runTests() {
  console.log('--- STARTING SOR DB-DRIVEN MODULE VERIFICATION ---');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // 1. Currency Utility Validation (Floating point precision)
  console.log('\n[Test 1] Decimal-safe Currency Calculations in INR');
  const rate1 = 300.45;
  const qty1 = 12.345;
  const amount1 = CurrencyUtil.calculateAmount(rate1, qty1);
  const expected1 = 3709.06; // 300.45 * 12.345 = 3709.05525 -> rounded to 3709.06
  if (amount1 !== expected1) {
    throw new Error(`Currency precision failed: got ${amount1}, expected ${expected1}`);
  }
  const floatSum = CurrencyUtil.add(0.1, 0.2);
  if (floatSum !== 0.3) {
    throw new Error(`Float addition failed: got ${floatSum}, expected 0.3`);
  }
  console.log(`✓ 300.45 x 12.345 = ₹${amount1} (Exact decimal safe)`);
  console.log(`✓ 0.1 + 0.2 = ${floatSum} (No floating point inaccuracies)`);

  // 2. Setup Test Company and User
  let testCompany = await Company.findOne({ name: 'BudgetPilot Test Corp' });
  if (!testCompany) {
    testCompany = await Company.create({
      name: 'BudgetPilot Test Corp',
      code: 'BPTC',
      email: 'test@budgetpilot.io',
      status: 'active',
    });
  }

  let testUser = await User.findOne({ email: 'sor_tester@budgetpilot.io' });
  if (!testUser) {
    testUser = await User.create({
      companyId: testCompany._id,
      name: 'SOR System Tester',
      email: 'sor_tester@budgetpilot.io',
      role: 'ADMIN',
      passwordHash: 'hashedpassword',
    });
  }

  const companyId = testCompany._id.toString();
  const userId = testUser._id.toString();

  // Clean prior test artifacts for this company
  await SorMaster.deleteMany({ companyId: testCompany._id });
  await UserRecentSor.deleteMany({ companyId: testCompany._id });
  await MasterOption.deleteMany({ companyId: testCompany._id });

  // 3. Test Empty State on Clean Database
  console.log('\n[Test 2] Empty State when Organization has No Records');
  const emptyHierarchy = await SorService.getScheduleHierarchy(companyId);
  if (emptyHierarchy.length !== 0) {
    throw new Error(`Expected 0 schedules for clean org, found ${emptyHierarchy.length}`);
  }
  const emptyRecents = await SorService.getRecentSors(companyId, userId);
  if (emptyRecents.length !== 0) {
    throw new Error(`Expected 0 recents for clean user, found ${emptyRecents.length}`);
  }
  console.log('✓ Clean organization returns 0 schedules and 0 recents (No fake/mock data injected)');

  // 4. Test Creation of Real SOR and Duplicate Prevention
  console.log('\n[Test 3] SOR Creation & Duplicate Name Prevention');
  const uniqueSorName = 'Metro Rail Phase 1 SOR';
  const sor1 = await SorService.createSorMaster(companyId, {
    sorName: uniqueSorName,
    country: 'India',
    state: 'Karnataka',
    owningBody: 'BMRCL',
    department: 'Civil',
    scheduleType: 'State Govt',
    version: '2026.1',
    description: 'Bangalore Metro Construction Schedule',
  });
  console.log(`✓ Successfully created SOR: "${sor1.sorName}" (ID: ${sor1._id})`);

  // Attempt duplicate name creation
  let duplicateRejected = false;
  try {
    await SorService.createSorMaster(companyId, {
      sorName: uniqueSorName,
      country: 'India',
      state: 'Karnataka',
      owningBody: 'BMRCL',
    });
  } catch (err: any) {
    if (err.statusCode === 409 || err.message.includes('already exists')) {
      duplicateRejected = true;
    }
  }
  if (!duplicateRejected) {
    throw new Error('Duplicate SOR name should have been rejected with 409 Conflict');
  }
  console.log('✓ Duplicate SOR name was correctly rejected with 409 Conflict');

  // 5. Add Items to the SOR and verify Hierarchy & Live Count
  console.log('\n[Test 4] Dynamic Item Counts and Hierarchy');
  const item1 = await SorItem.create({
    sorId: sor1._id,
    srNo: 1,
    itemCode: 'MR-01.01',
    subclauseCode: 'MR-01.01.a',
    chapter: 'Earthwork',
    workCategory: 'Earthwork • Excavation',
    descriptionEnglish: 'Excavation for station piers in hard rock',
    rate: 1850.5,
    unit: 'CUM',
    projectStage: 'Substructure',
    qcChecklist: 'Standard Rock Excavation Inspection',
    status: 'ACTIVE',
  });

  const updatedHierarchy = await SorService.getScheduleHierarchy(companyId);
  const foundSor = updatedHierarchy.find((s) => s._id.toString() === sor1._id.toString());
  if (!foundSor) {
    throw new Error('Created SOR was not found in getScheduleHierarchy');
  }
  if (foundSor.itemCount !== 1) {
    throw new Error(`Expected itemCount 1, got ${foundSor.itemCount}`);
  }
  console.log(`✓ Live item count dynamically verified: ${foundSor.itemCount} items`);

  // 6. Test Smart Search across real database items
  console.log('\n[Test 5] Smart Search on Real Database Records');
  const searchResults = await SorService.smartSearchSorItems(companyId, {
    sorId: sor1._id.toString(),
    search: 'hard rock',
  });
  if (searchResults.items.length === 0 || searchResults.items[0].itemCode !== 'MR-01.01') {
    throw new Error('Smart search failed to locate real database item');
  }
  console.log(`✓ Smart search found "${searchResults.items[0].itemCode} - ${searchResults.items[0].descriptionEnglish}"`);

  // 7. Test User Recent SOR Tracking (Database-stored per user)
  console.log('\n[Test 6] Per-User Recent SOR Tracking');
  await SorService.recordRecentSor(companyId, userId, sor1._id.toString());
  const userRecents = await SorService.getRecentSors(companyId, userId);
  if (userRecents.length !== 1 || userRecents[0].sorName !== uniqueSorName) {
    throw new Error('User recent SOR tracking failed');
  }
  console.log(`✓ User recent SOR persisted in MongoDB: "${userRecents[0].sorName}"`);

  // 8. Test Dynamic Master Options
  console.log('\n[Test 7] Dynamic Master Options');
  await SorService.createMasterOption(companyId, userId, {
    category: 'WORK_CATEGORY',
    value: 'Tunnelling & Underground Works',
  });
  const masterOpts = await SorService.getMasterOptions(companyId);
  if (!masterOpts.workCategories.includes('Tunnelling & Underground Works')) {
    throw new Error('Failed to create or retrieve dynamic master option');
  }
  console.log(`✓ Dynamic master options working: categories count = ${masterOpts.workCategories.length}`);

  // 9. Clean up test data
  console.log('\n[Test 8] Clean Up');
  await SorMaster.deleteMany({ companyId: testCompany._id });
  await SorItem.deleteMany({ sorId: sor1._id });
  await UserRecentSor.deleteMany({ companyId: testCompany._id });
  await MasterOption.deleteMany({ companyId: testCompany._id });
  await User.deleteOne({ _id: testUser._id });
  await Company.deleteOne({ _id: testCompany._id });
  console.log('✓ Test records cleaned up safely');

  await mongoose.disconnect();
  console.log('\n=== ALL SOR DB-DRIVEN VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
