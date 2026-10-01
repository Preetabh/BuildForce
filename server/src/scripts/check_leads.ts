import mongoose from 'mongoose';
import { env } from '../config/env';
import { Lead } from '../models/Lead';
import { ClientAccount } from '../models/ClientAccount';

async function check() {
  await mongoose.connect(env.MONGODB_URI);
  const leads = await Lead.find({}).lean();
  console.log('Leads count:', leads.length);
  for (const l of leads) {
    console.log(`Lead: ${l.leadCode} | Name: ${l.clientName} | Stage: ${l.stage} | isRegisteredClient: ${l.isRegisteredClient} | isDead: ${l.isDead}`);
  }
  const clients = await ClientAccount.find({}).lean();
  console.log('Clients count:', clients.length);
  for (const c of clients) {
    console.log(`Client: ${c.clientCode} | Name: ${c.name} | Agreed: ${c.agreedAmount}`);
  }
  await mongoose.disconnect();
}

check().catch(console.error);
