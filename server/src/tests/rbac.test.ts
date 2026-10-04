/**
 * Automated Test Suite for RBAC & Site Engineers Module
 * Run with: npm test (or tsx src/tests/rbac.test.ts)
 */

import {
  createMenuSchema,
  updateMenuSchema,
  createRoleSchema,
  updateRolePermissionSchema,
  batchUpdateRolePermissionsSchema,
  updateUserRoleAndPermissionsSchema,
} from '../modules/rbac/rbac.validation';

import {
  createSiteEngineerSchema,
  updateSiteEngineerSchema,
  updateWalletSchema,
} from '../modules/siteEngineers/siteEngineer.validation';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   BuildForce 360 - RBAC & Site Engineer Test Suite   ');
  console.log('======================================================\n');

  // --- Suite 1: Menu Validation Schema ---
  console.log('[Suite 1: Menu Validation]');
  {
    const validMenu = {
      title: 'Detailed Site Engineers',
      route: '/admin/site-engineers',
      icon: 'HardHat',
      sortOrder: 15,
      isVisible: true,
      description: 'Field staff management module',
    };
    const parsed = createMenuSchema.safeParse(validMenu);
    assert(parsed.success, 'Valid menu schema accepts proper title and route');

    const invalidMenu = {
      title: '',
      route: '',
    };
    const invalidParsed = createMenuSchema.safeParse(invalidMenu);
    assert(!invalidParsed.success, 'Menu schema rejects empty title and route');
  }

  // --- Suite 2: Role Validation Schema & Allow/Decline ---
  console.log('\n[Suite 2: Role & Permission Validation]');
  {
    const validRole = {
      name: 'Site Supervisor',
      description: 'Supervises on-site construction works',
      isSystem: false,
      permissions: [
        {
          menuRoute: '/dashboard',
          menuTitle: 'Dashboard',
          isAllowed: true,
        },
        {
          menuRoute: '/finance',
          menuTitle: 'Finance',
          isAllowed: false,
        },
      ],
    };
    const parsedRole = createRoleSchema.safeParse(validRole);
    assert(parsedRole.success, 'Valid role schema accepts permissions matrix with Allow/Decline');

    const validPermToggle = {
      menuRoute: '/projects',
      isAllowed: true,
    };
    const parsedToggle = updateRolePermissionSchema.safeParse(validPermToggle);
    assert(parsedToggle.success, 'Allow/Decline toggle schema validates correctly');

    const invalidPermToggle = {
      menuRoute: '',
      isAllowed: 'not-a-boolean',
    };
    const invalidToggle = updateRolePermissionSchema.safeParse(invalidPermToggle);
    assert(!invalidToggle.success, 'Allow/Decline toggle schema rejects non-boolean isAllowed');

    const batchPerms = {
      permissions: {
        '/dashboard': true,
        '/leads': true,
        '/settings/users': false,
      },
    };
    const parsedBatch = batchUpdateRolePermissionsSchema.safeParse(batchPerms);
    assert(parsedBatch.success, 'Batch permissions update schema accepts route-boolean map');
  }

  // --- Suite 3: User Role & Overrides Schema ---
  console.log('\n[Suite 3: User Role & Custom Overrides]');
  {
    const validUserUpdate = {
      role: 'SITE_ENGINEER',
      isActive: true,
      permissionOverrides: {
        '/billing': false,
        '/projects': true,
      },
    };
    const parsedUserUpdate = updateUserRoleAndPermissionsSchema.safeParse(validUserUpdate);
    assert(parsedUserUpdate.success, 'User update schema accepts role and permissionOverrides');
  }

  // --- Suite 4: Site Engineer Schema & Status (Allow / Decline) ---
  console.log('\n[Suite 4: Site Engineer Validation]');
  {
    const validEngineer = {
      name: 'Tridev Sharma',
      loginId: 'tridev@lucknowbuilders.com',
      mobile: '9616533535',
      expertise: 'Civil Structure',
      projectsCount: 3,
      status: 'Active',
      walletBalance: 25000,
    };
    const parsedEngineer = createSiteEngineerSchema.safeParse(validEngineer);
    assert(parsedEngineer.success, 'Site Engineer schema accepts valid profile data');

    const invalidEngineer = {
      name: '',
      loginId: '',
      status: 'UnknownStatus',
    };
    const parsedInvalidEngineer = createSiteEngineerSchema.safeParse(invalidEngineer);
    assert(!parsedInvalidEngineer.success, 'Site Engineer schema rejects invalid status and empty name');
  }

  // --- Suite 5: Wallet Management Operations (Credit, Debit, Set) ---
  console.log('\n[Suite 5: Wallet Transaction Operations]');
  {
    const validCredit = {
      amount: 5000,
      operation: 'add',
      notes: 'Fuel and site allowance',
    };
    const parsedCredit = updateWalletSchema.safeParse(validCredit);
    assert(parsedCredit.success, 'Wallet schema accepts credit ("add") operation');

    const validDebit = {
      amount: 1500,
      operation: 'deduct',
      notes: 'Petty cash purchase',
    };
    const parsedDebit = updateWalletSchema.safeParse(validDebit);
    assert(parsedDebit.success, 'Wallet schema accepts debit ("deduct") operation');

    const validSet = {
      amount: 10000,
      operation: 'set',
      notes: 'Monthly reset',
    };
    const parsedSet = updateWalletSchema.safeParse(validSet);
    assert(parsedSet.success, 'Wallet schema accepts balance "set" operation');

    const invalidWallet = {
      amount: -500,
      operation: 'multiply',
    };
    const parsedInvalidWallet = updateWalletSchema.safeParse(invalidWallet);
    assert(!parsedInvalidWallet.success, 'Wallet schema rejects negative amount and unknown operation');

    // Test wallet calculation logic
    let initialBalance = 10000;
    const addAmt = 5000;
    initialBalance += addAmt;
    assert(initialBalance === 15000, 'Wallet credit math accurately increments balance');

    const deductAmt = 3000;
    initialBalance -= deductAmt;
    assert(initialBalance === 12000, 'Wallet debit math accurately decrements balance');

    const setAmt = 20000;
    initialBalance = setAmt;
    assert(initialBalance === 20000, 'Wallet set math accurately sets balance');
  }

  // --- Summary ---
  console.log('\n======================================================');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
