import mongoose from 'mongoose';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Project } from '../models/Project';

async function checkUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/civil_guruji_erp');

  const users = await User.find({});
  console.log('Users in DB:');
  for (const u of users) {
    console.log({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      companyId: u.companyId?.toString(),
      role: (u as any).role,
    });
  }

  const projects = await Project.find({});
  console.log('Projects in DB:');
  for (const p of projects) {
    console.log({
      id: p._id.toString(),
      name: p.name,
      companyId: p.companyId?.toString(),
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

checkUsers().catch(console.error);
