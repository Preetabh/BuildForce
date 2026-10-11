import { Types } from 'mongoose';
import { DailySiteReport, IDailySiteReport, DailyReportStatus } from '../../models/DailySiteReport';
import { Project } from '../../models/Project';
import { ClientAccount } from '../../models/ClientAccount';
import { SiteEngineer } from '../../models/SiteEngineer';
import { User } from '../../models/User';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/error.middleware';
import { AuthUser } from '../../middleware/auth.middleware';
import { AuditService } from '../audit/audit.service';
import {
  CreateDailyReportInput,
  UpdateDailyReportInput,
  ReviewDailyReportInput,
} from './dailyReport.validation';
import { DailyReportFilterQuery, DailyReportSummaryStats } from './dailyReport.types';

export class DailyReportService {
  private static normalizeDate(dateInput: string | Date): Date {
    const d = new Date(dateInput);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  public static async createReport(
    companyId: string,
    authUser: AuthUser,
    input: CreateDailyReportInput,
    ipAddress?: string
  ) {
    const compObjectId = new Types.ObjectId(companyId);

    // 1. Resolve site: either Client site or Project
    let project: any = null;
    let client: any = null;

    if (input.clientId && Types.ObjectId.isValid(input.clientId)) {
      client = await ClientAccount.findOne({
        _id: new Types.ObjectId(input.clientId),
        companyId: compObjectId,
      });
    }

    if (!client && input.projectId && Types.ObjectId.isValid(input.projectId)) {
      project = await Project.findOne({
        _id: new Types.ObjectId(input.projectId),
        companyId: compObjectId,
        deletedAt: null,
      });
      if (!project) {
        // Fallback: input.projectId might be a ClientAccount id
        client = await ClientAccount.findOne({
          _id: new Types.ObjectId(input.projectId),
          companyId: compObjectId,
        });
      }
    }

    if (!project && !client) {
      throw new AppError('Site / Project or Client not found', 404);
    }

    const siteDisplayName = client ? `${client.name} (${client.clientCode || 'Client'})` : project.name;

    // 2. Identify site engineer
    let engineerDoc: any = null;
    if (authUser.role === 'SITE_ENGINEER') {
      engineerDoc = await SiteEngineer.findOne({
        companyId: compObjectId,
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      if (!engineerDoc) {
        throw new AppError('Site engineer profile not found for this account', 403);
      }

      // Check engineer authorization for client site or project
      let isAssigned = false;
      if (client) {
        isAssigned =
          (client.siteEngineerId && client.siteEngineerId.toString() === engineerDoc._id.toString()) ||
          (client.handlerName && engineerDoc.name && client.handlerName.toLowerCase().includes(engineerDoc.name.toLowerCase())) ||
          engineerDoc.assignedClientIds?.some((cId: any) => cId.toString() === client._id.toString());
      } else if (project) {
        isAssigned =
          engineerDoc.assignedProjectIds?.some((pId: any) => pId.toString() === project._id.toString()) ||
          project.assignedEngineers?.some((eId: any) => eId.toString() === engineerDoc._id.toString());
      }

      if (!isAssigned) {
        throw new AppError('Forbidden: You are not authorized to report on this site', 403);
      }
    } else {
      // Admin/Manager submitting: lookup engineer assigned to client/project or default
      if (client && client.siteEngineerId) {
        engineerDoc = await SiteEngineer.findOne({ _id: client.siteEngineerId, companyId: compObjectId });
      } else if (project) {
        engineerDoc = await SiteEngineer.findOne({ companyId: compObjectId, assignedProjectIds: project._id });
      }
      if (!engineerDoc) {
        engineerDoc = await SiteEngineer.findOne({ companyId: compObjectId });
      }
    }

    const engineerId = engineerDoc ? engineerDoc._id : new Types.ObjectId();
    const engineerName = engineerDoc ? engineerDoc.name : (authUser.name || authUser.email || 'Site Engineer');

    // 3. Normalize Date & Check duplicate
    const normalizedReportDate = this.normalizeDate(input.reportDate);

    const duplicateFilter: any = {
      companyId: compObjectId,
      reportDate: normalizedReportDate,
    };
    if (client) {
      duplicateFilter.$or = [{ clientId: client._id }, { projectId: client._id }];
    } else if (project) {
      duplicateFilter.projectId = project._id;
    }

    const existingReport = await DailySiteReport.findOne(duplicateFilter);

    if (existingReport) {
      if (existingReport.status === 'Draft') {
        return this.updateReport(companyId, existingReport._id.toString(), input, authUser, ipAddress);
      }
      throw new AppError(
        `A daily site report for "${siteDisplayName}" on ${normalizedReportDate.toISOString().slice(0, 10)} already exists (Report #${existingReport.reportNumber}). Authorized corrections must use the edit/revision flow.`,
        400
      );
    }

    // 4. Generate sequential Report Number
    const dateStr = normalizedReportDate.toISOString().slice(0, 10).replace(/-/g, '');
    const todayReportsCount = await DailySiteReport.countDocuments({
      companyId: compObjectId,
      reportDate: normalizedReportDate,
    });
    const reportNumber = `DSR-${dateStr}-${String(todayReportsCount + 1).padStart(3, '0')}`;

    const isSubmitted = input.status === 'Submitted';

    const report = await DailySiteReport.create({
      ...input,
      companyId: compObjectId,
      projectId: project ? project._id : null,
      clientId: client ? client._id : null,
      clientCode: client ? client.clientCode : '',
      siteEngineerId: engineerId,
      engineerUserId: new Types.ObjectId(authUser.userId),
      engineerName,
      reportNumber,
      reportDate: normalizedReportDate,
      status: input.status || 'Submitted',
      submissionTimestamp: isSubmitted ? new Date() : null,
      history: [
        {
          action: isSubmitted ? 'Report Submitted' : 'Saved as Draft',
          performedBy: new Types.ObjectId(authUser.userId),
          performerName: authUser.name || (authUser as any).email || 'Authorized User',
          performerRole: authUser.role,
          timestamp: new Date(),
          newStatus: input.status || 'Submitted',
          comments: 'Initial report submission',
        },
      ],
    });

    // Also sync with ClientAccount.dailyProgressReports if client exists
    if (client && isSubmitted) {
      await ClientAccount.findByIdAndUpdate(client._id, {
        $push: {
          dailyProgressReports: {
            reportDate: normalizedReportDate,
            workCompletedToday: input.workCompletedToday,
            materialsUsed: (input.materialsConsumed || []).map((m: any) => `${m.materialName} (${m.quantity} ${m.unit})`).join(', ') || 'Standard consumables',
            nextDayPlan: input.workPlannedTomorrow,
            siteKharcha: {
              labourCost: (input.workersCount || 0) * 500,
              materialCost: 0,
            },
            sitePhotos: (input.photos || []).map((p: any) => p.url),
            reportedBy: engineerName,
            createdAt: new Date(),
          },
        },
      });
    }

    if (isSubmitted) {
      // Update SiteEngineer last report date
      if (engineerDoc) {
        await SiteEngineer.findByIdAndUpdate(engineerDoc._id, {
          lastReportDate: normalizedReportDate,
        });
      }

      // Update Project progress
      if (project && typeof input.progressPercentage === 'number' && input.progressPercentage > 0) {
        await Project.findByIdAndUpdate(project._id, {
          progress: input.progressPercentage,
        });
      }

      // Notify Admins
      await Notification.create({
        companyId: compObjectId,
        recipientRole: 'ADMIN',
        title: 'New Daily Site Report',
        message: `${engineerName} submitted daily report ${reportNumber} for ${siteDisplayName}.`,
        type: 'REPORT_SUBMITTED',
        entityId: report._id,
        entityType: 'DailyReport',
        link: `/admin/daily-reports?reportId=${report._id}`,
      });
    }

    await AuditService.log({
      companyId,
      userId: authUser.userId,
      action: 'CREATE',
      entity: 'DailySiteReport',
      entityId: report._id.toString(),
      newValue: {
        reportNumber: report.reportNumber,
        site: project.name,
        date: normalizedReportDate,
        workers: report.workersCount,
        progress: report.progressPercentage,
      },
      ipAddress,
    });

    return report;
  }

  public static async getReports(
    companyId: string,
    query: DailyReportFilterQuery,
    authUser: AuthUser
  ) {
    const compObjectId = new Types.ObjectId(companyId);
    const filter: Record<string, any> = { companyId: compObjectId };

    // If Site Engineer, strictly restrict to their assigned sites
    if (authUser.role === 'SITE_ENGINEER') {
      const engineer = await SiteEngineer.findOne({
        companyId: compObjectId,
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      if (!engineer) {
        return {
          reports: [],
          pagination: { total: 0, page: 1, limit: query.limit || 15, totalPages: 0, hasMore: false },
          stats: this.getEmptyStats(),
        };
      }

      filter.projectId = { $in: engineer.assignedProjectIds || [] };
    }

    // Filters
    if (query.projectId && query.projectId !== 'all') {
      filter.projectId = new Types.ObjectId(query.projectId);
    }

    if (query.clientId && query.clientId !== 'all') {
      filter.clientId = new Types.ObjectId(query.clientId);
    }

    if (query.siteEngineerId && query.siteEngineerId !== 'all') {
      filter.siteEngineerId = new Types.ObjectId(query.siteEngineerId);
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filter.reportDate = {};
      if (query.startDate) {
        filter.reportDate.$gte = this.normalizeDate(query.startDate);
      }
      if (query.endDate) {
        const end = this.normalizeDate(query.endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.reportDate.$lte = end;
      }
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { reportNumber: searchRegex },
        { engineerName: searchRegex },
        { workCompletedToday: searchRegex },
        { issuesAndDelays: searchRegex },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 15;
    const skip = (page - 1) * limit;

    const [reports, total, stats] = await Promise.all([
      DailySiteReport.find(filter)
        .populate('projectId', 'name code location clientName status progress')
        .populate('clientId', 'name clientCode siteLocation phone services agreedAmount paidAmount')
        .populate('siteEngineerId', 'name loginId mobile expertise')
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DailySiteReport.countDocuments(filter),
      this.calculateSummaryStats(compObjectId),
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + reports.length < total,
      },
      stats,
    };
  }

  public static async getReportById(companyId: string, reportId: string, authUser: AuthUser) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new AppError('Invalid report ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const report = await DailySiteReport.findOne({
      _id: new Types.ObjectId(reportId),
      companyId: compObjectId,
    })
      .populate('projectId', 'name code location clientName status progress startDate endDate')
      .populate('siteEngineerId', 'name loginId mobile expertise')
      .populate('adminReview.reviewedBy', 'name email role')
      .lean();

    if (!report) {
      throw new AppError('Daily site report not found', 404);
    }

    // Site Engineer access check
    if (authUser.role === 'SITE_ENGINEER') {
      const engineer = await SiteEngineer.findOne({
        companyId: compObjectId,
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      const isAssigned =
        engineer &&
        engineer.assignedProjectIds?.some(
          (pId: any) => pId.toString() === (report.projectId as any)?._id?.toString()
        );

      if (!isAssigned) {
        throw new AppError('Forbidden: You do not have permission to view reports for this site', 403);
      }
    }

    // Fetch previous report for progress comparison
    const previousReport = await DailySiteReport.findOne({
      companyId: compObjectId,
      projectId: (report.projectId as any)?._id,
      reportDate: { $lt: report.reportDate },
      status: { $ne: 'Draft' },
    })
      .sort({ reportDate: -1 })
      .select('reportNumber reportDate progressPercentage workCompletedToday workersCount')
      .lean();

    return {
      ...report,
      previousReport,
    };
  }

  public static async updateReport(
    companyId: string,
    reportId: string,
    input: UpdateDailyReportInput,
    authUser: AuthUser,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new AppError('Invalid report ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const report = await DailySiteReport.findOne({
      _id: new Types.ObjectId(reportId),
      companyId: compObjectId,
    });

    if (!report) {
      throw new AppError('Daily site report not found', 404);
    }

    // Role check for Site Engineer
    if (authUser.role === 'SITE_ENGINEER') {
      const engineer = await SiteEngineer.findOne({
        companyId: compObjectId,
        $or: [
          { userId: new Types.ObjectId(authUser.userId) },
          { loginId: authUser.email.toLowerCase() },
        ],
      });

      if (!engineer || report.siteEngineerId.toString() !== engineer._id.toString()) {
        throw new AppError('Forbidden: You can only edit your own reports', 403);
      }

      if (report.status === 'Approved') {
        throw new AppError('Approved reports are locked and cannot be edited without admin authorization', 400);
      }
    }

    const oldStatus = report.status;
    const isNowSubmitting = input.status === 'Submitted';

    // Record in history audit log
    report.history.push({
      action: isNowSubmitting && oldStatus === 'Draft' ? 'Report Submitted' : 'Report Revised / Updated',
      performedBy: new Types.ObjectId(authUser.userId),
      performerName: authUser.name || (authUser as any).email || 'Authorized User',
      performerRole: authUser.role,
      timestamp: new Date(),
      previousStatus: oldStatus,
      newStatus: input.status || (oldStatus === 'Needs Correction' ? 'Submitted' : oldStatus),
      comments: input.correctionSummary || 'Report fields updated',
      changesSummary: `Version ${report.version + 1} resubmitted`,
    });

    report.version += 1;

    // Apply updates
    if (input.weather !== undefined) report.weather = input.weather;
    if (input.workingConditions !== undefined) report.workingConditions = input.workingConditions;
    if (input.workersCount !== undefined) report.workersCount = input.workersCount;
    if (input.workersBreakdown !== undefined) report.workersBreakdown = input.workersBreakdown;
    if (input.workCompletedToday !== undefined) report.workCompletedToday = input.workCompletedToday;
    if (input.workPlannedTomorrow !== undefined) report.workPlannedTomorrow = input.workPlannedTomorrow;
    if (input.materialsReceived !== undefined) report.materialsReceived = input.materialsReceived as any;
    if (input.materialsConsumed !== undefined) report.materialsConsumed = input.materialsConsumed as any;
    if (input.equipmentUsed !== undefined) report.equipmentUsed = input.equipmentUsed as any;
    if (input.progressPercentage !== undefined) report.progressPercentage = input.progressPercentage;
    if (input.safetyInspection !== undefined) report.safetyInspection = input.safetyInspection as any;
    if (input.issuesAndDelays !== undefined) report.issuesAndDelays = input.issuesAndDelays;
    if (input.remarks !== undefined) report.remarks = input.remarks;
    if (input.photos !== undefined) report.photos = input.photos as any;
    if (input.documents !== undefined) report.documents = input.documents as any;

    if (input.status) {
      report.status = input.status;
      if (input.status === 'Submitted' && !report.submissionTimestamp) {
        report.submissionTimestamp = new Date();
      }
    } else if (oldStatus === 'Needs Correction') {
      report.status = 'Submitted'; // Reset to submitted when engineer fixes it
    }

    await report.save();

    // Update project progress
    if (report.progressPercentage > 0 && report.status === 'Submitted') {
      await Project.findByIdAndUpdate(report.projectId, { progress: report.progressPercentage });
    }

    // Notify Admin about resubmission
    await Notification.create({
      companyId: compObjectId,
      recipientRole: 'ADMIN',
      title: 'Daily Report Updated',
      message: `${authUser.name} updated daily report ${report.reportNumber} for review.`,
      type: 'REPORT_SUBMITTED',
      entityId: report._id,
      entityType: 'DailyReport',
      link: `/admin/daily-reports?reportId=${report._id}`,
    });

    await AuditService.log({
      companyId,
      userId: authUser.userId,
      action: 'UPDATE',
      entity: 'DailySiteReport',
      entityId: report._id.toString(),
      newValue: {
        reportNumber: report.reportNumber,
        status: report.status,
        version: report.version,
      },
      ipAddress,
    });

    return report;
  }

  public static async reviewReport(
    companyId: string,
    reportId: string,
    input: ReviewDailyReportInput,
    authUser: AuthUser,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new AppError('Invalid report ID format', 400);
    }

    const compObjectId = new Types.ObjectId(companyId);
    const report = await DailySiteReport.findOne({
      _id: new Types.ObjectId(reportId),
      companyId: compObjectId,
    }).populate('projectId', 'name code');

    if (!report) {
      throw new AppError('Daily site report not found', 404);
    }

    const previousStatus = report.status;
    report.status = input.status;
    report.adminReview = {
      reviewedBy: new Types.ObjectId(authUser.userId),
      reviewerName: authUser.name || (authUser as any).email || 'Project Admin',
      reviewedAt: new Date(),
      status: input.status,
      comments: input.comments || '',
      correctionRequested: input.status === 'Needs Correction',
      correctionDetails: input.correctionDetails || input.comments || '',
    };

    report.history.push({
      action: input.status === 'Needs Correction' ? 'Correction Requested' : `Report Marked ${input.status}`,
      performedBy: new Types.ObjectId(authUser.userId),
      performerName: authUser.name || (authUser as any).email || 'Project Admin',
      performerRole: authUser.role,
      timestamp: new Date(),
      previousStatus,
      newStatus: input.status,
      comments: input.comments,
      changesSummary: input.correctionDetails,
    });

    await report.save();

    // Send Notification to Site Engineer
    if (report.engineerUserId) {
      const isCorrection = input.status === 'Needs Correction';
      const notificationTitle = isCorrection
        ? 'Correction Requested on Daily Report'
        : input.status === 'Approved'
        ? 'Daily Report Approved'
        : 'Daily Report Reviewed';

      const notificationMessage = isCorrection
        ? `Admin requested corrections on report ${report.reportNumber} (${(report.projectId as any)?.name}): ${input.correctionDetails || input.comments || 'Please revise and resubmit.'}`
        : `Your daily report ${report.reportNumber} for ${(report.projectId as any)?.name} was marked ${input.status}.`;

      await Notification.create({
        companyId: compObjectId,
        recipientId: report.engineerUserId,
        recipientRole: 'SITE_ENGINEER',
        title: notificationTitle,
        message: notificationMessage,
        type: isCorrection ? 'CORRECTION_REQUESTED' : input.status === 'Approved' ? 'REPORT_APPROVED' : 'REPORT_REVIEWED',
        entityId: report._id,
        entityType: 'DailyReport',
        link: `/engineer-dashboard?reportId=${report._id}`,
      });
    }

    await AuditService.log({
      companyId,
      userId: authUser.userId,
      action: 'UPDATE',
      entity: 'DailySiteReport',
      entityId: report._id.toString(),
      newValue: {
        action: 'REVIEW',
        status: report.status,
        comments: input.comments,
      },
      ipAddress,
    });

    return report;
  }

  public static async getMissingReports(companyId: string) {
    const compObjectId = new Types.ObjectId(companyId);
    const today = this.normalizeDate(new Date());

    // 1. All active sites
    const activeProjects = await Project.find({
      companyId: compObjectId,
      status: { $in: ['active', 'draft'] },
      deletedAt: null,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
      code: { $not: /-SP\d+/i },
    })
      .populate('assignedEngineers', 'name loginId mobile expertise status')
      .lean();

    // 2. Reports submitted for today
    const todayReports = await DailySiteReport.find({
      companyId: compObjectId,
      reportDate: today,
      status: { $ne: 'Draft' },
    })
      .select('projectId')
      .lean();

    const reportedProjectIds = new Set(
      todayReports.filter((r) => r.projectId).map((r) => r.projectId!.toString())
    );

    const missingSites = activeProjects.filter(
      (p) => !reportedProjectIds.has(p._id.toString())
    );

    return missingSites.map((site) => ({
      _id: site._id,
      name: site.name,
      code: site.code,
      location: site.location,
      clientName: site.clientName,
      status: site.status,
      progress: site.progress,
      assignedEngineers: site.assignedEngineers,
      deadline: '6:00 PM Today',
      isOverdue: new Date().getHours() >= 18,
    }));
  }

  public static async getSummaryStats(companyId: string | Types.ObjectId): Promise<DailyReportSummaryStats> {
    const compObjectId = typeof companyId === 'string' ? new Types.ObjectId(companyId) : companyId;
    return this.calculateSummaryStats(compObjectId);
  }

  public static async calculateSummaryStats(companyId: Types.ObjectId): Promise<DailyReportSummaryStats> {
    const today = this.normalizeDate(new Date());

    const [
      totalSites,
      activeEngineers,
      reportsSubmittedToday,
      pendingReviews,
      sitesWithIssuesCount,
      allActiveProjects,
      submittedProjectIds,
    ] = await Promise.all([
      Project.countDocuments({
        companyId,
        deletedAt: null,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
        code: { $not: /-SP\d+/i },
      }),
      SiteEngineer.countDocuments({ companyId, status: 'Active' }),
      DailySiteReport.countDocuments({
        companyId,
        reportDate: today,
        status: { $ne: 'Draft' },
      }),
      DailySiteReport.countDocuments({
        companyId,
        status: 'Submitted',
      }),
      DailySiteReport.countDocuments({
        companyId,
        $or: [
          { issuesAndDelays: { $exists: true, $ne: '' } },
          { 'safetyInspection.incidentsCount': { $gt: 0 } },
        ],
      }),
      Project.find({
        companyId,
        status: 'active',
        deletedAt: null,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
        code: { $not: /-SP\d+/i },
      }).select('_id'),
      DailySiteReport.find({
        companyId,
        reportDate: today,
        status: { $ne: 'Draft' },
      }).distinct('projectId'),
    ]);

    const activeIds = allActiveProjects.map((p) => p._id.toString());
    const submittedSet = new Set(submittedProjectIds.map((id) => id.toString()));
    const missingReportsToday = activeIds.filter((id) => !submittedSet.has(id)).length;

    return {
      totalSites,
      activeEngineers,
      reportsSubmittedToday,
      pendingReviews,
      missingReportsToday,
      sitesWithReportedIssues: sitesWithIssuesCount,
    };
  }

  private static getEmptyStats(): DailyReportSummaryStats {
    return {
      totalSites: 0,
      activeEngineers: 0,
      reportsSubmittedToday: 0,
      pendingReviews: 0,
      missingReportsToday: 0,
      sitesWithReportedIssues: 0,
    };
  }
}
