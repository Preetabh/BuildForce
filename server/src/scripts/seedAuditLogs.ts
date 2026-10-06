import mongoose, { Types } from 'mongoose';
import { env } from '../config/env';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Vendor } from '../models/Vendor';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../config/logger';

export const seedAuditLogs = async () => {
  try {
    logger.info('Connecting to MongoDB to seed audit logs...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    const companies = await Company.find();
    if (!companies || companies.length === 0) {
      logger.error('No company found to seed audit logs.');
      return;
    }

    for (const company of companies) {
      const users = await User.find({ companyId: company._id }).limit(10);
      const primaryUser = users[0] || {
        _id: new Types.ObjectId(),
        name: 'System Admin',
        email: 'admin@civilguruji.com',
        role: 'ADMIN',
      };
      const secondaryUser = users[1] || {
        _id: new Types.ObjectId(),
        name: 'Er. Priya Patel',
        email: 'manager@civilguruji.com',
        role: 'MANAGER',
      };

      const project = await Project.findOne({ companyId: company._id });
      const vendor = await Vendor.findOne({ companyId: company._id });

      const now = Date.now();
      const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000);
      const daysAgo = (d: number) => new Date(now - d * 24 * 3600 * 1000);

      const logsToCreate = [
      // 1. Login success
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'LOGIN',
        module: 'AUTH',
        entity: 'User',
        entityId: primaryUser._id.toString(),
        entityName: primaryUser.name,
        summary: `User ${primaryUser.name} (${primaryUser.email}) logged in via Web Portal`,
        ipAddress: '103.21.244.18',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: hoursAgo(1),
      },

      // 2. Project Update with Before -> After diff
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'UPDATE',
        module: 'PROJECTS',
        entity: 'Project',
        entityId: project ? project._id.toString() : new Types.ObjectId().toString(),
        entityName: project ? project.name : 'Cyber Gateway Commercial Tower',
        summary: 'Updated contract budget and status for project',
        oldValue: {
          contractValue: 45000000,
          status: 'draft',
          targetEndDate: '2025-06-30',
          siteManager: 'Er. Rajesh Sharma',
        },
        newValue: {
          contractValue: 52000000,
          status: 'active',
          targetEndDate: '2025-12-31',
          siteManager: 'Er. Rajesh Sharma',
        },
        diff: [
          {
            field: 'contractValue',
            label: 'Contract Budget (₹)',
            oldValue: '₹ 4,50,00,000',
            newValue: '₹ 5,20,00,000',
          },
          {
            field: 'status',
            label: 'Project Status',
            oldValue: 'draft',
            newValue: 'active',
          },
          {
            field: 'targetEndDate',
            label: 'Target Completion Date',
            oldValue: '2025-06-30',
            newValue: '2025-12-31',
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: hoursAgo(3),
      },

      // 3. Vendor creation
      {
        companyId: company._id,
        userId: secondaryUser._id,
        userSnapshot: { name: secondaryUser.name, email: secondaryUser.email, role: secondaryUser.role },
        action: 'CREATE',
        module: 'VENDORS',
        entity: 'Vendor',
        entityId: vendor ? vendor._id.toString() : new Types.ObjectId().toString(),
        entityName: vendor ? vendor.name : 'UltraTech ReadyMix Concretes',
        summary: 'Added new verified Material Supplier vendor',
        newValue: {
          name: vendor ? vendor.name : 'UltraTech ReadyMix Concretes',
          type: 'Material Supplier',
          contactPerson: 'Mr. Arvind Saxena',
          phone: '+91 98112 34567',
          city: 'Gurugram',
          status: 'active',
        },
        ipAddress: '49.36.128.45',
        device: { browser: 'Firefox', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: hoursAgo(6),
      },

      // 4. Permission grant (Security event)
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'PERMISSION_CHANGE',
        module: 'ROLES',
        entity: 'Role',
        entityId: 'SITE_ENGINEER',
        entityName: 'Site Engineer',
        summary: 'Granted menu route permission "Admin/MeasurementBook" to role Site Engineer',
        oldValue: { menuRoute: 'Admin/MeasurementBook', allowed: false },
        newValue: { menuRoute: 'Admin/MeasurementBook', allowed: true },
        diff: [
          {
            field: 'Admin/MeasurementBook',
            label: 'Measurement Book (e-MB)',
            oldValue: 'DECLINED',
            newValue: 'ALLOWED',
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'SECURITY',
        status: 'SUCCESS',
        timestamp: hoursAgo(12),
      },

      // 5. Failed authentication attempt (Critical security alarm)
      {
        companyId: company._id,
        userId: null,
        userSnapshot: { name: 'Unknown Attacker', email: 'root@buildforce.com', role: 'EXTERNAL' },
        action: 'LOGIN',
        module: 'AUTH',
        entity: 'User',
        entityId: 'ANONYMOUS',
        entityName: 'root@buildforce.com',
        summary: 'Suspicious login attempt with unauthorized credentials',
        ipAddress: '185.220.101.42',
        userAgent: 'curl/7.88.1 (x86_64-pc-linux-gnu)',
        device: { browser: 'Automated Bot', os: 'Linux', deviceType: 'Desktop' },
        severity: 'CRITICAL',
        status: 'FAILURE',
        failureReason: 'Invalid user email and bad JWT signature',
        timestamp: hoursAgo(18),
      },

      // 6. User status toggle
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'STATUS_CHANGE',
        module: 'USERS',
        entity: 'User',
        entityId: secondaryUser._id.toString(),
        entityName: secondaryUser.name,
        summary: `Account status for ${secondaryUser.name} toggled to ACTIVE`,
        oldValue: { isActive: false },
        newValue: { isActive: true },
        diff: [
          {
            field: 'isActive',
            label: 'Account Active Status',
            oldValue: false,
            newValue: true,
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'WARN',
        status: 'SUCCESS',
        timestamp: daysAgo(1),
      },

      // 7. Role assignment change
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'ROLE_CHANGE',
        module: 'USERS',
        entity: 'User',
        entityId: secondaryUser._id.toString(),
        entityName: secondaryUser.name,
        summary: `Elevated authority for ${secondaryUser.name} from SITE_ENGINEER to MANAGER`,
        oldValue: { role: 'SITE_ENGINEER' },
        newValue: { role: 'MANAGER' },
        diff: [
          {
            field: 'role',
            label: 'System Authority Role',
            oldValue: 'SITE_ENGINEER',
            newValue: 'MANAGER',
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'SECURITY',
        status: 'SUCCESS',
        timestamp: daysAgo(2),
      },

      // 8. Lead Creation
      {
        companyId: company._id,
        userId: secondaryUser._id,
        userSnapshot: { name: secondaryUser.name, email: secondaryUser.email, role: secondaryUser.role },
        action: 'CREATE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: new Types.ObjectId().toString(),
        entityName: 'DLF Phase 5 Luxury Villa Construction',
        summary: 'Created new residential construction project inquiry lead',
        newValue: {
          clientName: 'Sh. Vikramaditya Singhania',
          projectType: 'Commercial Turnkey',
          budgetEstimate: '₹ 12,00,00,000',
          source: 'Associate Partner Referral',
          status: 'QUALIFIED',
        },
        ipAddress: '49.36.128.45',
        device: { browser: 'Edge', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(3),
      },

      // 9. Vendor details update
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'UPDATE',
        module: 'VENDORS',
        entity: 'Vendor',
        entityId: vendor ? vendor._id.toString() : new Types.ObjectId().toString(),
        entityName: vendor ? vendor.name : 'Shree Cement Logistics',
        summary: 'Updated vendor GSTIN registration and tax compliance info',
        oldValue: { gstin: '07AAAAA0000A1Z5', paymentTerms: '15 Days Net' },
        newValue: { gstin: '07AAACS1429B1ZX', paymentTerms: '30 Days Net' },
        diff: [
          {
            field: 'gstin',
            label: 'GST Identification Number',
            oldValue: '07AAAAA0000A1Z5',
            newValue: '07AAACS1429B1ZX',
          },
          {
            field: 'paymentTerms',
            label: 'Credit Terms',
            oldValue: '15 Days Net',
            newValue: '30 Days Net',
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(4),
      },

      // 10. Worker status toggle
      {
        companyId: company._id,
        userId: secondaryUser._id,
        userSnapshot: { name: secondaryUser.name, email: secondaryUser.email, role: secondaryUser.role },
        action: 'STATUS_CHANGE',
        module: 'WORKERS',
        entity: 'Worker',
        entityId: new Types.ObjectId().toString(),
        entityName: 'Mohan Lal (Mason Lead)',
        summary: 'Activated subcontractor worker for Site Substructure phase',
        oldValue: { status: 'inactive' },
        newValue: { status: 'active' },
        diff: [
          {
            field: 'status',
            label: 'Worker Onboarding Status',
            oldValue: 'inactive',
            newValue: 'active',
          },
        ],
        ipAddress: '49.36.128.45',
        device: { browser: 'Safari', os: 'iOS', deviceType: 'Mobile' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(5),
      },

      // 11. Profile password update
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'PERMISSION_CHANGE',
        module: 'USERS',
        entity: 'User',
        entityId: primaryUser._id.toString(),
        entityName: primaryUser.name,
        summary: `User ${primaryUser.email} changed account password and updated security credentials`,
        oldValue: { passwordUpdated: false },
        newValue: { passwordUpdated: true, lastChanged: new Date() },
        diff: [
          {
            field: 'securityCredentials',
            label: 'Password Hash',
            oldValue: '[HASH_REDACTED]',
            newValue: '[HASH_REDACTED]',
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'SECURITY',
        status: 'SUCCESS',
        timestamp: daysAgo(6),
      },

      // 12. Delete action (Warning)
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'DELETE',
        module: 'PROJECTS',
        entity: 'SubProject',
        entityId: new Types.ObjectId().toString(),
        entityName: 'Tower C Excavation Staging (Archived Draft)',
        summary: 'Deleted temporary staging sub-project draft',
        oldValue: { name: 'Tower C Excavation Staging', status: 'draft' },
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'WARN',
        status: 'SUCCESS',
        timestamp: daysAgo(7),
      },

      // 13. Service catalog update
      {
        companyId: company._id,
        userId: secondaryUser._id,
        userSnapshot: { name: secondaryUser.name, email: secondaryUser.email, role: secondaryUser.role },
        action: 'UPDATE',
        module: 'SERVICES',
        entity: 'ServiceCatalog',
        entityId: new Types.ObjectId().toString(),
        entityName: 'Structural Engineering & RCC Design Service',
        summary: 'Updated base pricing rate and deliverables list',
        oldValue: { baseRate: 45, unit: 'sqft' },
        newValue: { baseRate: 55, unit: 'sqft' },
        diff: [
          {
            field: 'baseRate',
            label: 'Base Consultancy Rate (₹/sqft)',
            oldValue: 45,
            newValue: 55,
          },
        ],
        ipAddress: '49.36.128.45',
        device: { browser: 'Edge', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(8),
      },

      // 14. Lead Assignment
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'ASSIGNMENT',
        module: 'LEADS',
        entity: 'Lead',
        entityId: new Types.ObjectId().toString(),
        entityName: 'Noida Expressway Warehousing Hub',
        summary: `Assigned commercial lead to Field Lead ${secondaryUser.name}`,
        oldValue: { assignedTo: null },
        newValue: { assignedTo: secondaryUser.name },
        diff: [
          {
            field: 'assignedTo',
            label: 'Lead Owner / Assignee',
            oldValue: 'Unassigned',
            newValue: secondaryUser.name,
          },
        ],
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(10),
      },

      // 15. User Logout
      {
        companyId: company._id,
        userId: primaryUser._id,
        userSnapshot: { name: primaryUser.name, email: primaryUser.email, role: primaryUser.role },
        action: 'LOGOUT',
        module: 'AUTH',
        entity: 'User',
        entityId: primaryUser._id.toString(),
        entityName: primaryUser.name,
        summary: `User ${primaryUser.name} signed out securely`,
        ipAddress: '103.21.244.18',
        device: { browser: 'Chrome', os: 'Windows 10/11', deviceType: 'Desktop' },
        severity: 'INFO',
        status: 'SUCCESS',
        timestamp: daysAgo(12),
      },
    ];

        // Delete existing and insert fresh rich audit records (bypass middleware with collection.insertMany)
        await AuditLog.collection.deleteMany({ companyId: company._id });
        await AuditLog.collection.insertMany(logsToCreate as any);
        logger.info(`Successfully seeded ${logsToCreate.length} enterprise audit logs for company: ${company.name} (${company._id})`);
      }
    } catch (error) {
      logger.error('Failed to seed audit logs:', error);
    }
};

// If run directly
if (require.main === module) {
  seedAuditLogs().then(() => {
    logger.info('Audit logs seeding complete.');
    process.exit(0);
  });
}
