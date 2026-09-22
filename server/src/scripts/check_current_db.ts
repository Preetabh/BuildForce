import mongoose from 'mongoose';
import { SorMaster, SorItem } from '../models/SorMaster';
import { SorImport } from '../models/SorImport';
import { SorStagedItem } from '../models/SorStagedItem';
import { env } from '../config/env';

async function check() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB:', env.MONGODB_URI);

  const masters = await SorMaster.find({}).lean();
  console.log('SorMasters count:', masters.length);
  masters.forEach((m) => {
    console.log(`- Master ID: ${m._id}, Authority: ${m.authority}, Name: ${m.sorName}, Version: ${m.version}, Created: ${m.createdAt}`);
  });

  const imports = await SorImport.find({}).lean();
  console.log('\nSorImports count:', imports.length);
  imports.forEach((i) => {
    console.log(`- Import ID: ${i._id}, File: ${i.fileName}, Status: ${i.status}, Schedule: ${i.scheduleName}, RowsExtracted: ${i.progress?.rowsExtracted}, RowsImported: ${i.progress?.rowsImported}`);
  });

  const totalItems = await SorItem.countDocuments({});
  console.log('\nTotal SorItems in DB:', totalItems);

  const sampleItems = await SorItem.find({}).limit(5).lean();
  console.log('Sample SorItems:');
  sampleItems.forEach((it) => {
    console.log(`  [${it.itemCode}] "${it.descriptionEnglish.slice(0, 40)}..." Unit: ${it.unit} Rate: ${it.rate} Category: ${it.workCategory}`);
  });

  const stagedCount = await SorStagedItem.countDocuments({});
  console.log('\nTotal SorStagedItems in DB:', stagedCount);

  await mongoose.disconnect();
}

check().catch(console.error);
