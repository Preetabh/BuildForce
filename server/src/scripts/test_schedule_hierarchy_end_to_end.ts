import jwt from 'jsonwebtoken';
import { env } from '../config/env';

async function runEndToEndVerification() {
  console.log('=== RUNNING SCHEDULE HIERARCHY & SMART SEARCH END-TO-END VERIFICATION ===\n');

  const companyId = '6aae1e4dca306ed48ca9ce8b';
  const token = jwt.sign(
    {
      userId: '6aae1e4dca306ed48ca9ce8c',
      companyId,
      role: 'ADMIN',
      email: 'admin@buildforce.com',
      name: 'Admin User',
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 1. Test GET /api/sor/schedules/hierarchy
  console.log('1. Testing GET /api/sor/schedules/hierarchy ...');
  const resHierarchy = await fetch('http://localhost:5000/api/sor/schedules/hierarchy', {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   HTTP Status: ${resHierarchy.status}`);
  if (resHierarchy.status !== 200) {
    throw new Error(`Expected HTTP 200, got ${resHierarchy.status}`);
  }

  const jsonHierarchy = await resHierarchy.json();
  console.log(`   Success: ${jsonHierarchy.success}`);
  console.log(`   Schedules Count: ${jsonHierarchy.data?.length}`);

  if (!jsonHierarchy.success || !Array.isArray(jsonHierarchy.data) || jsonHierarchy.data.length === 0) {
    throw new Error('Schedule hierarchy returned empty or unsuccessful response');
  }

  const cpwdSchedule = jsonHierarchy.data.find((s: any) => s.sorName === 'CPWD SOR 2023');
  console.log('   CPWD Schedule Details:');
  console.log(`     - ID: ${cpwdSchedule?._id}`);
  console.log(`     - Authority: ${cpwdSchedule?.authority}`);
  console.log(`     - Type: ${cpwdSchedule?.scheduleType}`);
  console.log(`     - Name: ${cpwdSchedule?.sorName}`);
  console.log(`     - Version: ${cpwdSchedule?.version}`);
  console.log(`     - Category: ${cpwdSchedule?.category}`);
  console.log(`     - Item Count: ${cpwdSchedule?.itemCount}`);
  console.log(`     - Document: ${cpwdSchedule?.documentName}`);

  if (!cpwdSchedule || cpwdSchedule.itemCount !== 4060 || cpwdSchedule.authority !== 'CPWD') {
    throw new Error(`Schedule validation failed: expected 4060 items and authority CPWD, got: ${JSON.stringify(cpwdSchedule)}`);
  }

  // 2. Test Smart Search for item 2.1.1
  console.log('\n2. Testing Smart Search for item 2.1.1 ...');
  const res211 = await fetch(`http://localhost:5000/api/sor/items/smart-search?sorId=${cpwdSchedule._id}&search=2.1.1`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   HTTP Status: ${res211.status}`);
  const json211 = await res211.json();
  const item211 = json211.data?.[0];
  console.log('   Result for 2.1.1:');
  console.log(`     - Item Code: ${item211?.itemCode}`);
  console.log(`     - Description: ${item211?.descriptionEnglish}`);
  console.log(`     - Unit: ${item211?.unit}`);
  console.log(`     - Rate: ${item211?.rate}`);
  console.log(`     - Work Category: ${item211?.workCategory}`);
  console.log(`     - Formula: ${item211?.measurementFormula}`);

  if (
    item211?.itemCode !== '2.1.1' ||
    item211?.descriptionEnglish !== 'All kinds of soil' ||
    item211?.unit !== 'SQM' ||
    item211?.rate !== 129.85 ||
    item211?.workCategory !== 'EARTH WORK'
  ) {
    throw new Error(`Item 2.1.1 search validation failed: ${JSON.stringify(item211)}`);
  }

  // 3. Test Smart Search for item 2.2.1
  console.log('\n3. Testing Smart Search for item 2.2.1 ...');
  const res221 = await fetch(`http://localhost:5000/api/sor/items/smart-search?sorId=${cpwdSchedule._id}&search=2.2.1`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json221 = await res221.json();
  const item221 = json221.data?.[0];
  console.log('   Result for 2.2.1:');
  console.log(`     - Item Code: ${item221?.itemCode}`);
  console.log(`     - Description: ${item221?.descriptionEnglish}`);
  console.log(`     - Unit: ${item221?.unit}`);
  console.log(`     - Rate: ${item221?.rate}`);
  console.log(`     - Work Category: ${item221?.workCategory}`);

  if (
    item221?.itemCode !== '2.2.1' ||
    item221?.unit !== 'CUM' ||
    item221?.rate !== 395.3 ||
    item221?.workCategory !== 'EARTH WORK'
  ) {
    throw new Error(`Item 2.2.1 search validation failed: ${JSON.stringify(item221)}`);
  }

  // 4. Test Unauthenticated Request Handling
  console.log('\n4. Testing Unauthenticated Request (401 expected) ...');
  const resNoAuth = await fetch('http://localhost:5000/api/sor/schedules/hierarchy');
  console.log(`   HTTP Status: ${resNoAuth.status}`);
  const jsonNoAuth = await resNoAuth.json();
  console.log(`   Response: ${JSON.stringify(jsonNoAuth)}`);
  if (resNoAuth.status !== 401) {
    throw new Error(`Expected HTTP 401 for unauthenticated request, got ${resNoAuth.status}`);
  }

  console.log('\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
}

runEndToEndVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
