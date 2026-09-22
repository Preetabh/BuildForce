import mongoose from 'mongoose';
import { SorMaster, SorItem } from '../models/SorMaster';
import { SorImport } from '../models/SorImport';
import { SorService } from '../modules/sor/sor.service';

async function diagnoseSchedules() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');
  console.log('--- DIAGNOSING SCHEDULES & SOR MASTERS ---');

  const sorMasters = await SorMaster.find({});
  console.log(`Total SorMaster documents in DB: ${sorMasters.length}`);
  console.log('SorMasters:', JSON.stringify(sorMasters, null, 2));

  const sorImports = await SorImport.find({});
  console.log(`Total SorImport documents in DB: ${sorImports.length}`);
  console.log('SorImports:', JSON.stringify(sorImports.map(i => ({
    _id: i._id,
    fileName: (i as any).fileName || (i as any).originalFilename || (i as any).name,
    status: i.status,
    sorName: (i as any).sorName,
    metadata: (i as any).metadata,
    stats: (i as any).stats,
  })), null, 2));

  const totalSorItems = await SorItem.countDocuments({});
  console.log(`Total SorItem documents in DB: ${totalSorItems}`);

  // Check unique sorId in SorItem
  const distinctSorIds = await SorItem.distinct('sorId');
  console.log('Distinct sorIds referenced in SorItem:', distinctSorIds);

  // Check unique departments, versions, scheduleTypes in SorItem / SorMaster
  const distinctDepts = await SorItem.distinct('department');
  console.log('Distinct departments in SorItem:', distinctDepts);

  // Check SorService.getScheduleHierarchy()
  try {
    const hierarchy = await SorService.getScheduleHierarchy();
    console.log('SorService.getScheduleHierarchy() output:', JSON.stringify(hierarchy, null, 2));
  } catch (err: any) {
    console.error('Error in SorService.getScheduleHierarchy():', err);
  }

  await mongoose.disconnect();
}

diagnoseSchedules().catch(console.error);
