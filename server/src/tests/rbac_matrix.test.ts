/**
 * RBAC Comprehensive Matrix & End-to-End Test Suite
 * Tests dynamic role permissions, custom user overrides, API blocking, and role separation.
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { RbacRole } from '../models/RbacRole';
import { Company } from '../models/Company';
import { checkUserPermission, hasPermission } from '../middleware/rbac.middleware';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runRbacMatrixTests() {
  console.log('\n======================================================');
  console.log('   BuildForce 360 - RBAC Matrix & Security Test Suite   ');
  console.log('======================================================\n');

  try {
    await mongoose.connect(env.MONGODB_URI);

    // Setup temporary test company
    const testCompany = await Company.create({
      name: 'RBAC Test Org',
      code: `TEST-${Date.now()}`,
      contactEmail: `test-${Date.now()}@test.io`,
    });

    // Setup 3 test roles: Master Admin, Site Engineer, and Counsellor
    const masterAdminRole = await RbacRole.create({
      companyId: testCompany._id,
      name: 'Master Admin',
      code: 'MASTER_ADMIN',
      isSystem: true,
      permissions: [
        { menuRoute: 'Admin/Settings', menuTitle: 'Settings Access', allow: true },
        { menuRoute: 'Admin/SiteEngineersSection', menuTitle: 'Site Engineers Access', allow: true },
        { menuRoute: 'Admin/Management', menuTitle: 'Management Access', allow: true },
      ],
    });

    const siteEngineerRole = await RbacRole.create({
      companyId: testCompany._id,
      name: 'Site Engineer',
      code: 'SITE_ENGINEER',
      isSystem: false,
      permissions: [
        { menuRoute: 'Admin/Settings', menuTitle: 'Settings Access', allow: false },
        { menuRoute: 'Admin/SiteEngineersSection', menuTitle: 'Site Engineers Access', allow: true },
        { menuRoute: 'Admin/Management', menuTitle: 'Management Access', allow: false },
      ],
    });

    const counsellorRole = await RbacRole.create({
      companyId: testCompany._id,
      name: 'Counsellor',
      code: 'COUNSELLOR',
      isSystem: false,
      permissions: [
        { menuRoute: 'Admin/Settings', menuTitle: 'Settings Access', allow: false },
        { menuRoute: 'Admin/SiteEngineersSection', menuTitle: 'Site Engineers Access', allow: false },
        { menuRoute: 'Admin/Management', menuTitle: 'Management Access', allow: true },
      ],
    });

    // 1. Create a Master Admin user
    const adminUser = await User.create({
      name: 'Test Master Admin',
      email: `admin-${Date.now()}@test.io`,
      passwordHash: 'dummy',
      role: 'MASTER_ADMIN',
      companyId: testCompany._id,
      isActive: true,
    });

    // 2. Create a Site Engineer user
    const engineerUser = await User.create({
      name: 'Test Site Engineer',
      email: `engineer-${Date.now()}@test.io`,
      passwordHash: 'dummy',
      role: 'SITE_ENGINEER',
      companyId: testCompany._id,
      isActive: true,
    });

    // 3. Create a Counsellor user
    const counsellorUser = await User.create({
      name: 'Test Counsellor',
      email: `counsellor-${Date.now()}@test.io`,
      passwordHash: 'dummy',
      role: 'COUNSELLOR',
      companyId: testCompany._id,
      isActive: true,
    });

    console.log('[Test Group 1: Role-Level Defaults & Separation]');
    {
      const adminCanSettings = await checkUserPermission(
        adminUser._id.toString(),
        testCompany._id.toString(),
        adminUser.role,
        'Admin/Settings'
      );
      assert(adminCanSettings === true, 'Master Admin has access to Admin/Settings');

      const engineerCanSite = await checkUserPermission(
        engineerUser._id.toString(),
        testCompany._id.toString(),
        engineerUser.role,
        'Admin/SiteEngineersSection'
      );
      assert(engineerCanSite === true, 'Site Engineer has access to Site Engineers section');

      const engineerCanSettings = await checkUserPermission(
        engineerUser._id.toString(),
        testCompany._id.toString(),
        engineerUser.role,
        'Admin/Settings'
      );
      assert(engineerCanSettings === false, 'Site Engineer is blocked from Admin/Settings (403)');

      const counsellorCanMgmt = await checkUserPermission(
        counsellorUser._id.toString(),
        testCompany._id.toString(),
        counsellorUser.role,
        'Admin/Management'
      );
      assert(counsellorCanMgmt === true, 'Counsellor has access to Lead Management');

      const counsellorCanSite = await checkUserPermission(
        counsellorUser._id.toString(),
        testCompany._id.toString(),
        counsellorUser.role,
        'Admin/SiteEngineersSection'
      );
      assert(counsellorCanSite === false, 'Counsellor is blocked from Site Engineers section (403)');
    }

    console.log('\n[Test Group 2: Custom User-Level Granular Overrides]');
    {
      // Give the Counsellor a custom granular override granting Admin/Settings
      counsellorUser.permissions = { 'Admin/Settings': true };
      await counsellorUser.save();

      const counsellorWithOverride = await checkUserPermission(
        counsellorUser._id.toString(),
        testCompany._id.toString(),
        counsellorUser.role,
        'Admin/Settings'
      );
      assert(
        counsellorWithOverride === true,
        'Custom override correctly grants Admin/Settings to Counsellor'
      );

      // Now set explicit false override for Master Admin on Admin/Settings
      adminUser.permissions = { 'Admin/Settings': false };
      await adminUser.save();

      const adminWithOverride = await checkUserPermission(
        adminUser._id.toString(),
        testCompany._id.toString(),
        adminUser.role,
        'Admin/Settings'
      );
      assert(
        adminWithOverride === false,
        'Explicit false override on Master Admin strictly blocks Admin/Settings'
      );
    }

    console.log('\n[Test Group 3: Dynamic Role Permission Updates]');
    {
      // Toggle Counsellor Lead Management to false in RbacRole
      await RbacRole.updateOne(
        { _id: counsellorRole._id },
        { $set: { 'permissions.$[elem].allow': false } },
        { arrayFilters: [{ 'elem.menuRoute': 'Admin/Management' }] }
      );

      // Remove custom override to check role default
      counsellorUser.permissions = {};
      await counsellorUser.save();

      const counsellorUpdated = await checkUserPermission(
        counsellorUser._id.toString(),
        testCompany._id.toString(),
        counsellorUser.role,
        'Admin/Management'
      );
      assert(
        counsellorUpdated === false,
        'Dynamic role permission decline takes effect immediately in MongoDB'
      );
    }

    console.log('\n[Test Group 4: Deactivated User Access Block]');
    {
      engineerUser.isActive = false;
      await engineerUser.save();

      const deactivatedEngineer = await checkUserPermission(
        engineerUser._id.toString(),
        testCompany._id.toString(),
        engineerUser.role,
        'Admin/SiteEngineersSection'
      );
      assert(
        deactivatedEngineer === false,
        'Deactivated user is completely blocked from all actions'
      );
    }

    // Cleanup test data
    await User.deleteMany({ companyId: testCompany._id });
    await RbacRole.deleteMany({ companyId: testCompany._id });
    await Company.deleteOne({ _id: testCompany._id });

    console.log('\n======================================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runRbacMatrixTests();
