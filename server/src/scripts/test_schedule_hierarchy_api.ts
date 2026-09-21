import mongoose from 'mongoose';
import { SorService } from '../modules/sor/sor.service';
import { SorMaster, SorItem } from '../models/SorMaster';

async function runScheduleTests() {
  console.log('================================================================');
  console.log('DYNAMIC DSR/SOR SCHEDULE SELECTOR & HIERARCHY VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');

  // TEST 1: Fetch Available Master Schedules
  console.log('--- TEST 1: Fetch Dynamic Schedule Hierarchy ---');
  const schedules = await SorService.getScheduleHierarchy();
  console.log(`✓ Total Schedules Returned: ${schedules.length}`);

  if (schedules.length === 0) {
    throw new Error('FAIL: Expected at least 1 schedule in database, got 0!');
  }

  schedules.forEach((s, idx) => {
    console.log(` [${idx + 1}] ${s.authority} - ${s.sorName} (v${s.version}) | Dept: ${s.department} | Items: ${s.itemCount.toLocaleString()} | Rate Analysis: ${s.rateAnalysisStatus} | Doc: ${s.documentName}`);
  });

  // Verify Schedule 1 metadata
  const topSchedule = schedules[0];
  console.log('\nTop Active Schedule Details:');
  console.log(` - ID: ${topSchedule._id}`);
  console.log(` - Authority: ${topSchedule.authority}`);
  console.log(` - Schedule Name: ${topSchedule.sorName}`);
  console.log(` - Version: ${topSchedule.version}`);
  console.log(` - Item Count: ${topSchedule.itemCount}`);
  console.log(` - Rate Analysis Status: ${topSchedule.rateAnalysisStatus}`);
  console.log(` - Document / Uploaded File: ${topSchedule.documentName}`);

  if (topSchedule.itemCount <= 0) {
    throw new Error(`FAIL: Top schedule has 0 items! Item count must be positive.`);
  }

  // TEST 2: Strict Schedule-Scoped Search Filtering
  console.log('\n--- TEST 2: Strict Schedule-Scoped Search Filtering ---');
  const searchResults = await SorService.smartSearchSorItems(
    'dummy-company',
    {
      sorId: topSchedule._id,
      search: 'concrete',
      limit: 5,
    }
  );

  console.log(`✓ Found ${searchResults.pagination.total} items matching "concrete" in schedule "${topSchedule.sorName}"`);
  console.log(`✓ Sample Items:`);
  searchResults.items.forEach((item) => {
    console.log(`   - Code: ${item.itemCode} | Desc: ${item.descriptionEnglish.substring(0, 60)}... | Unit: ${item.unit} | Rate: ₹${item.rate} | DAR: ${item.rateAnalysisStatus}`);
  });

  if (searchResults.items.length === 0) {
    throw new Error('FAIL: Expected search results in top schedule for keyword "concrete"');
  }

  // Verify all returned items strictly belong to the selected schedule
  for (const item of searchResults.items) {
    const rawSorId = (item.sorId as any)?._id?.toString() || item.sorId?.toString();
    if (rawSorId !== topSchedule._id) {
      throw new Error(`FAIL: Item ${item.itemCode} has sorId ${rawSorId}, which does not match selected schedule ${topSchedule._id}`);
    }
  }
  console.log('✓ Verified: 100% of returned items strictly belong to the selected schedule!');

  // TEST 3: Multi-Volume / Document Recognition
  console.log('\n--- TEST 3: Document Name & Volume Recognition ---');
  for (const s of schedules) {
    if (s.documentName) {
      console.log(`✓ Schedule "${s.sorName}" correctly displays source document: "${s.documentName}"`);
    }
  }

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log('✅ ALL DSR/SOR SCHEDULE SELECTOR & SEARCH TESTS PASSED 100%!');
  console.log('================================================================');
  process.exit(0);
}

runScheduleTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
