import mongoose from 'mongoose';
import { BoqItem, Boq } from '../models/Boq';
import { Project } from '../models/Project';
import { SorItem } from '../models/SorMaster';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');

  const plasterBoq = await BoqItem.findById('6ab0e34c55bffd2393630bb1');
  console.log('Plaster BOQ Item Details:', JSON.stringify(plasterBoq, null, 2));

  if (plasterBoq) {
    const proj = await Project.findById(plasterBoq.projectId);
    console.log('Project:', proj?.name, proj?._id);
  }

  // Also check if there are other BOQ items in that project:
  if (plasterBoq) {
    const allBoqInProj = await BoqItem.find({ projectId: plasterBoq.projectId });
    console.log('All BOQ items in project:', JSON.stringify(allBoqInProj.map(b => ({
      _id: b._id,
      itemCode: b.itemCode,
      desc: b.description,
      unit: b.unit,
      qty: b.quantity,
      rate: b.rate,
      derived: b.isDerivedFromMeasurement,
      sorRef: b.sorReference,
    })), null, 2));
  }

  // Check SorItem for 13.1.1
  const sor1311 = await SorItem.findOne({ itemCode: '13.1.1' });
  console.log('SOR Item 13.1.1:', JSON.stringify(sor1311, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
