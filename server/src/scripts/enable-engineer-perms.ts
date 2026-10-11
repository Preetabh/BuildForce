import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function enableAllEngineerPerms() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const keysToEnable = [
    'Admin/SiteEngineersSection',
    'Admin/SiteEngineers_List',
    'Admin/ManageSiteEngineers',
    'Admin/DailyReportList',
    'Admin/Clients',
    'SiteEngineer/Dashboard',
    'SiteEngineer/SubmitReport',
    'SiteEngineer/AssignedSites',
    'SiteEngineer/Wallet',
    '/admin/site-engineers',
    '/admin/daily-reports',
    '/engineer-dashboard',
    '/engineer/sites',
    '/engineer/wallet',
    '/engineer/submit-report',
    'report.view',
    'report.create',
    'report.edit',
    'project.view',
  ];

  const roles = await mongoose.connection.collection('rbacroles').find({
    code: 'SITE_ENGINEER',
  }).toArray();

  for (const r of roles) {
    const permMap = new Map();
    (r.permissions || []).forEach((p: any) => permMap.set(p.menuRoute, p));

    keysToEnable.forEach((key) => {
      permMap.set(key, {
        menuRoute: key,
        menuTitle: key,
        allow: true,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      });
    });

    await mongoose.connection.collection('rbacroles').updateOne(
      { _id: r._id },
      { $set: { permissions: Array.from(permMap.values()) } }
    );
    console.log('Updated role:', r.name, 'companyId:', r.companyId);
  }

  console.log('Done enabling permissions for SITE_ENGINEER!');
  await mongoose.disconnect();
}

enableAllEngineerPerms().catch((e) => {
  console.error(e);
  process.exit(1);
});
