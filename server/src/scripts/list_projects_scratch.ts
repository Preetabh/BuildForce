import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { SiteEngineer } from '../models/SiteEngineer';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB');

  // List all site engineers
  const engineers = await SiteEngineer.find({}).select('name loginId status assignedProjects').lean();
  console.log('Total site engineers:', engineers.length);
  engineers.forEach((e: any) => console.log(`  - ${e.name} (${e.loginId}) [${e.status}] - ${e.assignedProjects?.length || 0} projects`));

  await mongoose.disconnect();
}

run().catch(console.error);
