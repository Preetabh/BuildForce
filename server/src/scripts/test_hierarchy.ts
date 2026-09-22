import mongoose from 'mongoose';
import { SorService } from '../modules/sor/sor.service';

async function testHierarchy() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');

  console.log('--- Testing getScheduleHierarchy for Company 1 (6aae240ba3ecda3125367cdf) ---');
  const h1 = await SorService.getScheduleHierarchy('6aae240ba3ecda3125367cdf');
  console.log('Result 1:', JSON.stringify(h1, null, 2));

  console.log('\n--- Testing getScheduleHierarchy for Company 2 (6aae1e4dca306ed48ca9ce8b) ---');
  const h2 = await SorService.getScheduleHierarchy('6aae1e4dca306ed48ca9ce8b');
  console.log('Result 2:', JSON.stringify(h2, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

testHierarchy().catch((e) => {
  console.error(e);
  process.exit(1);
});
