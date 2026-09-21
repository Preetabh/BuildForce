import mongoose from 'mongoose';
import { BoqItem } from '../models/Boq';
import { SorItem } from '../models/SorMaster';

async function fixCorruptData() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');
  console.log('Connected to MongoDB for data cleanup...');

  // 1. Fix the BOQ item with itemCode: 'Plaster' and unit: 'mm'
  const plasterBoq = await BoqItem.findById('6ab0e34c55bffd2393630bb1');
  if (plasterBoq) {
    console.log(`Found corrupt BOQ item ${plasterBoq._id} (${plasterBoq.itemCode}): unit '${plasterBoq.unit}' -> updating to 'sqm'`);
    plasterBoq.unit = 'sqm';
    plasterBoq.description = '12 mm cement plaster of mix 1:6 on fair side of wall';
    plasterBoq.rate = 294;
    plasterBoq.amount = Number((plasterBoq.quantity * plasterBoq.rate).toFixed(2));
    await plasterBoq.save();
    console.log('✓ Updated Plaster BOQ item to unit sqm (m²).');
  }

  // 2. Scan all other BOQ items for unit: 'mm'
  const otherMmItems = await BoqItem.find({ unit: 'mm' });
  for (const item of otherMmItems) {
    console.log(`Fixing item ${item._id} (${item.itemCode}): unit '${item.unit}' -> 'cum'`);
    item.unit = 'cum';
    await item.save();
  }

  await mongoose.disconnect();
  console.log('Cleanup complete.');
}

fixCorruptData().catch(console.error);
