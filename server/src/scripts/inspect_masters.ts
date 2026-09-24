import mongoose from 'mongoose';
import { SorMaster, SorItem } from '../models/SorMaster';
import { SorImport } from '../models/SorImport';
import { Company } from '../models/Company';

import { env } from '../config/env';

async function main() {
  await mongoose.connect(env.MONGODB_URI);

  const companies = await Company.find({});
  console.log('Companies:', companies.map(c => ({ id: c._id.toString(), name: c.name })));

  const allSorMasters = await SorMaster.find({});
  console.log(`Total SorMasters: ${allSorMasters.length}`);
  for (const m of allSorMasters) {
    const itemCount = await SorItem.countDocuments({ sorId: m._id });
    console.log({
      _id: m._id.toString(),
      companyId: m.companyId?.toString(),
      sorName: m.sorName,
      authority: m.authority,
      version: m.version,
      status: m.status,
      itemCount,
    });
  }

  const allSorImports = await SorImport.find({});
  console.log(`Total SorImports: ${allSorImports.length}`);
  for (const imp of allSorImports) {
    console.log({
      _id: imp._id.toString(),
      companyId: imp.companyId?.toString(),
      fileName: imp.fileName,
      status: imp.status,
      authority: (imp as any).authority || (imp as any).metadata?.authority,
      scheduleName: (imp as any).scheduleName || (imp as any).metadata?.scheduleName,
      version: (imp as any).version || (imp as any).metadata?.version,
      stats: imp.stats,
    });
  }

  const itemsWithoutMaster = await SorItem.countDocuments({ $or: [{ sorId: null }, { sorId: { $exists: false } }] });
  console.log(`SorItems without sorId: ${itemsWithoutMaster}`);

  const distinctSorIdsInItems = await SorItem.distinct('sorId');
  console.log('Distinct sorIds in SorItem:', distinctSorIdsInItems.map(id => id?.toString()));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
