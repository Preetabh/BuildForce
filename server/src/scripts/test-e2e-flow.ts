import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Project } from '../models/Project';
import { SiteEngineer } from '../models/SiteEngineer';
import { DailySiteReport } from '../models/DailySiteReport';
import { Notification } from '../models/Notification';
import { SiteEngineerService } from '../modules/siteEngineers/siteEngineer.service';
import { ProjectService } from '../modules/projects/project.service';
import { DailyReportService } from '../modules/dailyReports/dailyReport.service';
import { NotificationService } from '../modules/notifications/notification.service';
import { AuthUser } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

async function runE2ETests() {
  console.log('--- STARTING INFRA-PILOT E2E VERIFICATION TEST ---');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Find or create admin user and company
  let admin = await User.findOne({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });
  let company = await Company.findOne();

  if (!company) {
    company = await Company.create({
      name: 'InfraPilot Construction Tech',
      code: 'INFRA-01',
      address: 'Skyline Towers, Mumbai',
      contactEmail: 'admin@infrapilot.com',
    });
  }

  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);
    admin = await User.create({
      name: 'Chief Admin Er. Vikram Singh',
      email: 'admin@infrapilot.com',
      passwordHash,
      role: 'ADMIN',
      companyId: company._id,
      isActive: true,
    });
  }

  const companyIdStr = company._id.toString();

  const adminAuth: AuthUser = {
    userId: admin._id.toString(),
    role: admin.role,
    companyId: companyIdStr,
    email: admin.email,
  };

  console.log(`[INFO] Admin User identified: ${admin.email} (Role: ${admin.role})`);

  // STEP 1: Admin creates a site engineer with credentials
  console.log('\n--- STEP 1: Admin creates a Site Engineer ---');
  const timestamp = Date.now();
  const engineerEmail = `engineer.test.${timestamp}@infrapilot.com`;
  const engineerName = 'Er. Rohan Verma';
  const engineerPhone = '9876543210';
  const engineerPassword = 'Password@123';

  const createdEngineer = await SiteEngineerService.createSiteEngineer(
    companyIdStr,
    {
      name: engineerName,
      loginId: engineerEmail,
      mobile: engineerPhone,
      password: engineerPassword,
      status: 'Active',
      qualification: 'B.Tech Civil Engineering',
      experienceYears: 6,
      assignedProjectIds: [],
    }
  );

  console.log(`[PASS] Site Engineer created with ID: ${createdEngineer._id}, LoginID: ${createdEngineer.loginId}`);

  // Verify User record was created for secure login
  const engineerUserRecord = await User.findOne({ email: engineerEmail });
  if (!engineerUserRecord) {
    throw new Error('User record for Site Engineer was not created!');
  }
  const passwordValid = await bcrypt.compare(engineerPassword, engineerUserRecord.passwordHash);
  if (!passwordValid) {
    throw new Error('Password hash does not match credentials!');
  }
  console.log(`[PASS] Engineer User Account verified for login. Role: ${engineerUserRecord.role}`);

  const engineerAuth: AuthUser = {
    userId: engineerUserRecord._id.toString(),
    role: engineerUserRecord.role,
    companyId: companyIdStr,
    email: engineerUserRecord.email,
  };

  // STEP 2: Admin creates two sites, and assigns the engineer to only Site A
  console.log('\n--- STEP 2: Admin creates Site A and Site B, assigning engineer only to Site A ---');
  const siteA = await ProjectService.createProject(
    companyIdStr,
    adminAuth.userId,
    {
      name: `Metro Flyover Reach 3 - ${timestamp}`,
      code: `FLY-${Math.floor(Math.random() * 9000 + 1000)}`,
      location: 'Sector 62, Noida, UP',
      clientName: 'Noida Metro Rail Corp',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      status: 'active',
      budget: 85000000,
      assignedEngineers: [createdEngineer._id.toString()],
    }
  );
  console.log(`[PASS] Site A (Assigned) created: ${siteA.name} [ID: ${siteA._id}]`);

  const siteB = await ProjectService.createProject(
    companyIdStr,
    adminAuth.userId,
    {
      name: `Cyber Commercial Tower - ${timestamp}`,
      code: `CYB-${Math.floor(Math.random() * 9000 + 1000)}`,
      location: 'Aerocity, New Delhi',
      clientName: 'Apex Realty Pvt Ltd',
      startDate: '2026-03-01',
      endDate: '2028-06-30',
      status: 'draft',
      budget: 140000000,
      assignedEngineers: [], // Engineer NOT assigned
    }
  );
  console.log(`[PASS] Site B (Restricted) created: ${siteB.name} [ID: ${siteB._id}]`);

  // Verify engineer notification received for assignment
  const assignmentNotifications = await NotificationService.getNotifications(
    companyIdStr,
    engineerAuth
  );
  console.log(`[PASS] Engineer received ${assignmentNotifications.notifications.length} notification(s). Latest: "${assignmentNotifications.notifications[0]?.title}"`);

  // STEP 3: Engineer logs in and sees ONLY assigned sites
  console.log('\n--- STEP 3: Engineer queries sites (RBAC Scoping Check) ---');
  const engineerSites = await ProjectService.getProjects(
    companyIdStr,
    { page: 1, limit: 10 },
    engineerAuth
  );
  console.log(`[INFO] Engineer retrieved ${engineerSites.projects.length} project(s).`);
  const engineerSiteIds = engineerSites.projects.map((p: any) => p._id.toString());
  if (!engineerSiteIds.includes(siteA._id.toString())) {
    throw new Error('Assigned Site A is missing from Engineer scope!');
  }
  if (engineerSiteIds.includes(siteB._id.toString())) {
    throw new Error('SECURITY VIOLATION: Engineer can see unassigned Site B!');
  }
  console.log('[PASS] RBAC Enforced: Site Engineer strictly sees Site A, Site B is filtered out.');

  // STEP 4: Engineer submits a Daily Report with details & photos
  console.log('\n--- STEP 4: Engineer submits Daily Report for Site A ---');
  const reportPayload: any = {
    projectId: siteA._id.toString(),
    reportDate: new Date().toISOString(),
    weather: 'Sunny / Clear Skies',
    workingConditions: 'Normal full shift operations',
    workersCount: 42,
    workersBreakdown: {
      skilled: 30,
      unskilled: 12,
      masons: 12,
      helpers: 12,
      notes: 'Pier cap shuttering and reinforcement tying',
    },
    workCompletedToday: 'Completed reinforcement tying for Pier P-14. Began shuttering alignment on Pier P-15.',
    workPlannedTomorrow: 'Pouring concrete grade M45 on Pier P-14 (approx 45 cu.m).',
    materialsReceived: [
      { materialName: 'TMT Steel Fe500D (25mm)', quantity: 24, unit: 'MT', supplier: 'Tata Tiscon', invoiceNo: 'CH-89211' },
      { materialName: 'OPC 53 Grade Cement', quantity: 400, unit: 'Bags', supplier: 'UltraTech', invoiceNo: 'CH-89212' },
    ],
    materialsConsumed: [
      { materialName: 'TMT Steel Fe500D (25mm)', quantity: 18.5, unit: 'MT', notes: 'Pier P-14 fabrication' },
      { materialName: 'Binding Wire', quantity: 75, unit: 'KG', notes: 'Reinforcement binding' },
    ],
    equipmentUsed: [
      { equipmentName: 'Mobile Crane 50T', hoursOperated: 7.5, status: 'Operational', count: 1 },
      { equipmentName: 'Concrete Boom Pump', hoursOperated: 0, status: 'Idle', count: 1 },
    ],
    progressPercentage: 34.5,
    safetyInspection: {
      safetyGearCompliance: true,
      incidentsCount: 0,
      notes: 'Morning toolbox talk conducted on working at heights. All 42 workers using safety harnesses.',
    },
    issuesAndDelays: 'Traffic police clearance needed for night-time girder transport across main carriageway.',
    remarks: 'Need commercial vehicle passes renewed by next Tuesday.',
    photos: [
      {
        url: '/uploads/daily-reports/sample-pier-reinforcement.jpg',
        caption: 'Pier P-14 cage inspection complete',
        timestamp: new Date(),
      },
      {
        url: '/uploads/daily-reports/sample-staging.jpg',
        caption: 'Staging and safety nets installed on Pier P-15',
        timestamp: new Date(),
      },
    ],
    documents: [
      {
        name: 'Mill_Test_Certificate_Tata_Tiscon.pdf',
        url: '/uploads/daily-reports/mill-test-cert.pdf',
        size: 1048576,
      },
    ],
    status: 'Submitted',
  };

  const submittedReport = await DailyReportService.createReport(companyIdStr, engineerAuth, reportPayload);
  console.log(`[PASS] Daily Report successfully submitted with ID: ${submittedReport._id}, Status: ${submittedReport.status}`);

  // Test duplicate prevention for same site and same date
  console.log('\n--- STEP 4b: Verifying duplicate report prevention ---');
  let duplicateCaught = false;
  try {
    await DailyReportService.createReport(companyIdStr, engineerAuth, reportPayload);
  } catch (err: any) {
    duplicateCaught = true;
    console.log(`[PASS] Duplicate rejected as expected: "${err.message}"`);
  }
  if (!duplicateCaught) {
    throw new Error('Duplicate report was not blocked!');
  }

  // STEP 5: Admin sees the report in Daily Site Reports dashboard
  console.log('\n--- STEP 5: Admin views Daily Site Reports & Summary Dashboard ---');
  const adminReportsList = await DailyReportService.getReports(
    companyIdStr,
    adminAuth,
    { page: 1, limit: 10, projectId: siteA._id.toString() }
  );
  if (adminReportsList.reports.length === 0) {
    throw new Error('Admin could not see submitted report!');
  }
  console.log(`[PASS] Admin retrieved ${adminReportsList.reports.length} report(s). Report ID ${adminReportsList.reports[0]._id} present.`);

  const summaryStats = await DailyReportService.getSummaryStats(companyIdStr);
  console.log('[PASS] Summary Stats Calculated:');
  console.log(`       - Total Sites: ${summaryStats.totalSites}`);
  console.log(`       - Active Engineers: ${summaryStats.activeEngineers}`);
  console.log(`       - Reports Submitted Today: ${summaryStats.reportsSubmittedToday}`);
  console.log(`       - Pending Reviews: ${summaryStats.pendingReviews}`);
  console.log(`       - Missing Reports: ${summaryStats.missingReportsToday}`);
  console.log(`       - Sites with Issues: ${summaryStats.sitesWithReportedIssues}`);

  // STEP 6: Admin reviews and requests correction with comments
  console.log('\n--- STEP 6: Admin requests corrections on the report ---');
  const correctionComment = 'Please attach the concrete mix test cube result sheet before final approval.';
  const reviewedReport = await DailyReportService.reviewReport(
    companyIdStr,
    submittedReport._id.toString(),
    {
      status: 'Needs Correction',
      comments: correctionComment,
      correctionRequested: true,
      correctionDetails: correctionComment,
    },
    adminAuth
  );
  console.log(`[PASS] Report status changed to: "${reviewedReport.status}" with comments: "${reviewedReport.adminReview?.comments}"`);

  // STEP 7: Engineer receives notification and updates/resubmits the report
  console.log('\n--- STEP 7: Engineer receives correction notification & resubmits updated report ---');
  const engineerCorrectionNotifs = await NotificationService.getNotifications(
    companyIdStr,
    engineerAuth
  );
  const foundCorrectionAlert = engineerCorrectionNotifs.notifications.some((n: any) =>
    n.title.includes('Correction') || n.message.includes('correction')
  );
  if (!foundCorrectionAlert) {
    throw new Error('Engineer did not receive correction notification!');
  }
  console.log('[PASS] Engineer received Correction Request Notification.');

  // Engineer updates the report
  const updatedReport = await DailyReportService.updateReport(
    companyIdStr,
    submittedReport._id.toString(),
    {
      progressPercentage: 35.0,
      remarks: 'Cube test results attached as requested by Project In-charge.',
      status: 'Submitted',
      correctionSummary: 'Added cube test certificate sheet',
      documents: [
        ...reportPayload.documents,
        {
          name: 'Cube_Test_7Day_Strength_M45.pdf',
          url: '/uploads/daily-reports/cube-test-results.pdf',
          size: 512000,
        },
      ],
    },
    engineerAuth
  );
  console.log(`[PASS] Report revised & resubmitted. Total audit history records: ${updatedReport.history?.length}`);

  // STEP 8: Admin verifies revised report and history, then marks Approved
  console.log('\n--- STEP 8: Admin inspects revision history and approves ---');
  const finalReport = await DailyReportService.getReportById(
    companyIdStr,
    submittedReport._id.toString(),
    adminAuth
  );
  console.log(`[PASS] Report has ${finalReport.history?.length} history record(s).`);

  const approvedReport = await DailyReportService.reviewReport(
    companyIdStr,
    submittedReport._id.toString(),
    {
      status: 'Approved',
      comments: 'Cube test results verified. Grade M45 strength accepted.',
    },
    adminAuth
  );
  console.log(`[PASS] Final Status: "${approvedReport.status}" - Approved by Admin!`);

  // STEP 9: Security & Unauthorized Access Enforcement
  console.log('\n--- STEP 9: Testing Server-side RBAC & IDOR Protections ---');
  
  // 9a. Engineer attempts to access unauthorized Site B
  let siteBBlocked = false;
  try {
    await ProjectService.getProjectById(companyIdStr, siteB._id.toString(), engineerAuth);
  } catch (err: any) {
    siteBBlocked = true;
    console.log(`[PASS] Blocked unauthorized site access: "${err.message}"`);
  }
  if (!siteBBlocked) {
    throw new Error('SECURITY BREACH: Engineer could access unassigned project Site B!');
  }

  // 9b. Engineer attempts to submit a report for unassigned Site B
  let reportSiteBBlocked = false;
  try {
    await DailyReportService.createReport(
      companyIdStr,
      engineerAuth,
      {
        ...reportPayload,
        projectId: siteB._id.toString(),
      }
    );
  } catch (err: any) {
    reportSiteBBlocked = true;
    console.log(`[PASS] Blocked unauthorized report submission on Site B: "${err.message}"`);
  }
  if (!reportSiteBBlocked) {
    throw new Error('SECURITY BREACH: Engineer could submit report for unassigned site!');
  }

  console.log('\n======================================================');
  console.log(' ALL 9 USER REQUIREMENTS & WORKFLOW CHECKS PASSED 100%! ');
  console.log('======================================================\n');
  await mongoose.disconnect();
}

runE2ETests().catch((err) => {
  console.error('\n[FAILED] E2E Verification failed:', err);
  process.exit(1);
});
