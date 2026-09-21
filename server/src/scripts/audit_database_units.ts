import mongoose from 'mongoose';
import { SorItem, SorMaster } from '../models/SorMaster';
import { BoqItem } from '../models/Boq';
import { Measurement } from '../models/Measurement';
import { SorRateAnalysis } from '../models/SorRateAnalysis';

async function auditDatabaseUnits() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');
  console.log('--- DATABASE UNIT AUDIT ---');

  const distinctUnits = await SorItem.distinct('unit');
  console.log('Distinct SOR Item Units:', distinctUnits);

  const boqUnits = await BoqItem.distinct('unit');
  console.log('Distinct BOQ Item Units:', boqUnits);

  // Check any BOQ items with 'mm' or unusual units
  const invalidBoqItems = await BoqItem.find({ unit: { $in: ['mm', 'cm', 'inch', '', null] } });
  console.log(`Found ${invalidBoqItems.length} BOQ items with linear/unusual units:`);
  invalidBoqItems.forEach(b => {
    console.log(` - ID: ${b._id}, Code: ${b.itemCode}, Desc: ${b.description}, Unit: ${b.unit}, Qty: ${b.quantity}, Rate: ${b.rate}`);
  });

  // Check any SOR items with invalid/incompatible units
  const invalidSorItems = await SorItem.find({ unit: { $in: ['mm', 'cm', 'inch', '', null] } });
  console.log(`Found ${invalidSorItems.length} SOR items with invalid units:`);
  invalidSorItems.forEach(s => {
    console.log(` - ID: ${s._id}, Code: ${s.itemCode}, Desc: ${s.descriptionEnglish?.substring(0, 50)}, Unit: ${s.unit}`);
  });

  await mongoose.disconnect();
}

auditDatabaseUnits().catch(console.error);
