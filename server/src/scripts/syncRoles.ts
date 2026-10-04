import mongoose from 'mongoose';
import { env } from '../config/env';
import { RbacRole } from '../models/RbacRole';
import { Company } from '../models/Company';
import { logger } from '../config/logger';

const defaultRolesList = [
  { name: 'Master Admin', code: 'MASTER_ADMIN', color: '#F59E0B', isSystem: true, desc: 'Full unrestricted governance across all portal modules and security settings' },
  { name: 'Counsellor', code: 'COUNSELLOR', color: '#3B82F6', isSystem: false, desc: 'Lead counselling, client engagement and admission/inquiry followups' },
  { name: 'Accountant', code: 'ACCOUNTANT', color: '#10B981', isSystem: false, desc: 'Financial records, fee collections, payroll and payment accounting' },
  { name: 'Employee', code: 'EMPLOYEE', color: '#6366F1', isSystem: false, desc: 'Standard staff employee with access to task assignments and self portal' },
  { name: 'Developer', code: 'DEVELOPER', color: '#EC4899', isSystem: false, desc: 'Software engineering, portal integrations, APIs and system maintenance' },
  { name: 'Site Engineer', code: 'SITE_ENGINEER', color: '#F97316', isSystem: false, desc: 'Field operations, e-MB measurements, DPR logs, and daily execution reporting' },
  { name: 'Interior Designer', code: 'INTERIOR_DESIGNER', color: '#8B5CF6', isSystem: false, desc: 'Architectural finishes, material specification, 3D modelling and layouts' },
  { name: 'Project Manager', code: 'PROJECT_MANAGER', color: '#14B8A6', isSystem: false, desc: 'Planning, schedule adherence, budgets, BOQ execution, and site governance' },
  { name: 'Architect', code: 'ARCHITECT', color: '#EAB308', isSystem: false, desc: 'Structural and spatial blueprint planning, compliance and aesthetic designs' },
  { name: 'Estimate Engineer', code: 'ESTIMATE_ENGINEER', color: '#06B6D4', isSystem: false, desc: 'Rate analysis, SOR masters, quantity estimations, and BOQ costing' },
  { name: 'BDM', code: 'BDM', color: '#A855F7', isSystem: false, desc: 'Business development, client acquisitions, partnerships, and revenue expansion' },
];

async function syncRoles() {
  try {
    logger.info('Connecting to MongoDB for roles sync...');
    await mongoose.connect(env.MONGODB_URI);

    const companies = await Company.find();
    for (const company of companies) {
      // Remove old non-matching roles for clean alignment with screenshot
      await RbacRole.deleteMany({ companyId: company._id });

      for (const r of defaultRolesList) {
        await RbacRole.create({
          companyId: company._id,
          name: r.name,
          code: r.code,
          description: r.desc,
          color: r.color,
          isSystem: r.isSystem,
          permissions: [],
        });
      }
      logger.info(`Synced 11 standard roles for company: ${company.name}`);
    }

    logger.info('Roles synced successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('Failed to sync roles:', err);
    process.exit(1);
  }
}

syncRoles();
