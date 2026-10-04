import mongoose from 'mongoose';
import { Lead, ILead } from '../../models/Lead';
import { Partner } from '../../models/Partner';
import { ClientAccount } from '../../models/ClientAccount';
import { PaymentRecord } from '../../models/PaymentRecord';
import { CommissionRecord } from '../../models/CommissionRecord';
import { PartnerPayout } from '../../models/PartnerPayout';
import { Company } from '../../models/Company';
import { CommissionService } from './commission.service';

export interface LeadFilterParams {
  search?: string;
  statusMode?: 'NonDead' | 'Dead' | 'Converted' | 'Client' | 'All' | 'Active';
  companyCode?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  stage?: string;
  priority?: string;
  view?: 'list' | 'today-due' | 'process';
  page?: number;
  limit?: number;
  userId?: string;
  viewingUserId?: string;
  selectedUserId?: string;
  userName?: string;
  todayOnly?: boolean | string;
}

export class LeadService {
  /**
   * Fetch leads with full filter, user-scoped lead management, and pagination support
   */
  static async getLeads(companyId: string, params: LeadFilterParams) {
    const andConditions: any[] = [{ companyId: new mongoose.Types.ObjectId(companyId) }];

    // 1. Status mode (Active / NonDead / Dead / Converted / All)
    if (params.statusMode === 'Dead') {
      andConditions.push({ isDead: true });
    } else if (params.statusMode === 'Converted' || (params.statusMode as any) === 'Client') {
      andConditions.push({ $or: [{ isRegisteredClient: true }, { stage: 'Client' }] });
    } else if (params.statusMode === 'All' || params.view === 'process') {
      // In All mode or process view, include all leads
    } else {
      // Default: Active (NonDead leads)
      andConditions.push({
        isDead: false,
        isRegisteredClient: { $ne: true },
        stage: { $ne: 'Client' },
      });
    }

    // 2. Search
    if (params.search && params.search.trim()) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      andConditions.push({
        $or: [
          { clientName: searchRegex },
          { email: searchRegex },
          { leadCode: searchRegex },
          { mobile1: searchRegex },
          { mobile2: searchRegex },
          { siteLocation: searchRegex },
          { requirements: searchRegex },
          { 'referenceDetails.partnerName': searchRegex },
          { 'referenceDetails.channel': searchRegex },
          { 'referenceDetails.employeeName': searchRegex },
        ],
      });
    }

    // 3. User / Team Member Filter (when viewing a user's lead management)
    const effectiveTargetUserId = params.viewingUserId || params.selectedUserId || params.userId;
    const userOrConditions: any[] = [];
    if (effectiveTargetUserId && mongoose.Types.ObjectId.isValid(effectiveTargetUserId)) {
      userOrConditions.push({ createdBy: new mongoose.Types.ObjectId(effectiveTargetUserId) });
    }
    if (params.userName && params.userName.trim()) {
      const safeName = params.userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(`^${safeName}$`, 'i');
      userOrConditions.push({ 'referenceDetails.employeeName': nameRegex });
      userOrConditions.push({ 'followUps.createdByName': nameRegex });
    }
    if (userOrConditions.length > 0) {
      andConditions.push({ $or: userOrConditions });
    }

    // 4. Single Date or Date Range
    if (params.date) {
      const selected = new Date(params.date);
      if (!isNaN(selected.getTime())) {
        const dStart = new Date(selected);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(selected);
        dEnd.setHours(23, 59, 59, 999);

        andConditions.push({
          $or: [
            { leadDate: { $gte: dStart, $lte: dEnd } },
            { createdAt: { $gte: dStart, $lte: dEnd } },
            { 'followUps.date': { $gte: dStart, $lte: dEnd } },
            { 'followUps.createdAt': { $gte: dStart, $lte: dEnd } },
          ],
        });
      }
    } else if (params.startDate || params.endDate) {
      const dateCond: any = {};
      if (params.startDate) {
        dateCond.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateCond.$lte = end;
      }
      andConditions.push({ leadDate: dateCond });
    }

    // 5. Today Only Filter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (params.todayOnly === true || params.todayOnly === 'true') {
      andConditions.push({
        $or: [
          { leadDate: { $gte: todayStart, $lte: todayEnd } },
          { createdAt: { $gte: todayStart, $lte: todayEnd } },
          { 'followUps.date': { $gte: todayStart, $lte: todayEnd } },
          { 'followUps.createdAt': { $gte: todayStart, $lte: todayEnd } },
        ],
      });
    }

    // 6. Company code filter (LB / LD / All)
    if (params.companyCode && params.companyCode !== 'All Companies' && params.companyCode !== 'ALL') {
      andConditions.push({ targetCompanyCode: params.companyCode });
    }

    // 7. Service filter
    if (params.service && params.service !== 'All Services' && params.service !== 'ALL') {
      andConditions.push({ requirements: { $in: [params.service] } });
    }

    // 8. Stage filter
    if (params.stage && params.stage !== 'ALL') {
      andConditions.push({ stage: params.stage });
    }

    // 9. Priority filter
    if (params.priority && params.priority !== 'ALL') {
      andConditions.push({ priority: params.priority });
    }

    // 10. View: today-due filter
    if (params.view === 'today-due') {
      andConditions.push({ 'latestFollowUp.date': { $lte: todayEnd } });
    }

    const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, leads, stats] = await Promise.all([
      Lead.countDocuments(query),
      Lead.find(query)
        .sort({ leadCode: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.getLeadStats(companyId),
    ]);

    // Calculate Today's Activity Stats for the specified user
    let userTodayStats: any = null;
    if (userOrConditions.length > 0) {
      const userBaseQuery = {
        companyId: new mongoose.Types.ObjectId(companyId),
        $or: userOrConditions,
      };

      const [userTotal, userTodayLeads, userLeadsDocs] = await Promise.all([
        Lead.countDocuments(userBaseQuery),
        Lead.countDocuments({
          companyId: new mongoose.Types.ObjectId(companyId),
          $and: [
            { $or: userOrConditions },
            {
              $or: [
                { createdAt: { $gte: todayStart, $lte: todayEnd } },
                { leadDate: { $gte: todayStart, $lte: todayEnd } },
              ],
            },
          ],
        }),
        Lead.find(userBaseQuery).select('followUps').lean(),
      ]);

      let userFollowUpsToday = 0;
      const targetName = params.userName ? params.userName.trim().toLowerCase() : '';
      for (const doc of userLeadsDocs) {
        if (Array.isArray(doc.followUps)) {
          for (const f of doc.followUps) {
            const fDate = f.createdAt ? new Date(f.createdAt) : f.date ? new Date(f.date) : null;
            if (fDate && fDate >= todayStart && fDate <= todayEnd) {
              if (!targetName || (f.createdByName && f.createdByName.trim().toLowerCase() === targetName)) {
                userFollowUpsToday++;
              }
            }
          }
        }
      }

      userTodayStats = {
        leadsCreatedToday: userTodayLeads,
        followUpsToday: userFollowUpsToday,
        totalManaged: userTotal,
        userId: effectiveTargetUserId || params.userId || '',
        userName: params.userName || '',
      };
    }

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
      userTodayStats,
    };
  }

  /**
   * Get stats for leads summary header
   */
  static async getLeadStats(companyId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [totalActive, totalDead, totalClients, todayDueCount] = await Promise.all([
      Lead.countDocuments({
        companyId: compId,
        isDead: false,
        isRegisteredClient: { $ne: true },
        stage: { $ne: 'Client' },
      }),
      Lead.countDocuments({ companyId: compId, isDead: true }),
      Lead.countDocuments({
        companyId: compId,
        $or: [{ stage: 'Client' }, { isRegisteredClient: true }],
      }),
      Lead.countDocuments({
        companyId: compId,
        isDead: false,
        isRegisteredClient: { $ne: true },
        stage: { $ne: 'Client' },
        'latestFollowUp.date': { $lte: endOfDay },
      }),
    ]);

    return {
      totalActive,
      totalDead,
      totalClients,
      todayDueCount,
      totalAll: totalActive + totalDead + totalClients,
    };
  }

  /**
   * Get single lead by ID
   */
  static async getLeadById(companyId: string, leadId: string) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  /**
   * Create a new Lead
   */
  static async createLead(companyId: string, leadData: Partial<ILead>, userId?: string) {
    // Generate auto-increment 6 digit lead code e.g. "001262"
    const latestLead = await Lead.findOne({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ leadCode: -1 })
      .lean();

    let nextNumber = 1262;
    if (latestLead && latestLead.leadCode) {
      const parsed = parseInt(latestLead.leadCode.replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        nextNumber = parsed + 1;
      }
    }

    const leadCode = String(nextNumber).padStart(6, '0');

    // Partner attribution
    if (leadData.referenceType === 'Associate' && leadData.referenceDetails?.partnerName) {
      const partner = await Partner.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        name: leadData.referenceDetails.partnerName,
      });

      if (partner) {
        partner.totalLeadsReferred += 1;
        await partner.save();
        leadData.referenceDetails.partnerId = partner._id as any;
      }
    }

    // Default target company name from code
    let targetCompanyName = 'Lucknow Builders';
    if (leadData.targetCompanyCode === 'LD') {
      targetCompanyName = 'Lucknow Developers';
    } else if (leadData.targetCompanyCode === 'LB') {
      targetCompanyName = 'Lucknow Builders';
    }

    const newLead = new Lead({
      ...leadData,
      companyId: new mongoose.Types.ObjectId(companyId),
      leadCode,
      targetCompanyName,
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    // If meeting date is set, make it initial follow up
    if (leadData.meetingDateTime) {
      const meetingDate = new Date(leadData.meetingDateTime);
      newLead.followUps.push({
        date: meetingDate,
        remarks: `Meeting scheduled on ${meetingDate.toLocaleDateString()}`,
        status: 'Scheduled',
        createdAt: new Date(),
        createdByName: 'System',
      });
      newLead.latestFollowUp = {
        date: meetingDate,
        remarks: `Meeting scheduled on ${meetingDate.toLocaleDateString()}`,
      };
    }

    await newLead.save();
    return newLead;
  }

  /**
   * Update lead details
   */
  static async updateLead(companyId: string, leadId: string, updateData: Partial<ILead>) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Update fields
    Object.assign(lead, updateData);

    // Update target company name if code changed
    if (updateData.targetCompanyCode === 'LD') {
      lead.targetCompanyName = 'Lucknow Developers';
    } else if (updateData.targetCompanyCode === 'LB') {
      lead.targetCompanyName = 'Lucknow Builders';
    }

    if (lead.stage === 'Client' && !lead.isRegisteredClient) {
      await LeadService.ensureClientAccount(companyId, lead);
    } else {
      await lead.save();
    }
    return lead;
  }

  /**
   * Delete single lead
   */
  static async deleteLead(companyId: string, leadId: string) {
    const res = await Lead.deleteOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Delete all leads for company
   */
  static async deleteAllLeads(companyId: string) {
    const res = await Lead.deleteMany({
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Delete all clients for company
   */
  static async deleteAllClients(companyId: string) {
    const res = await ClientAccount.deleteMany({
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Remove ALL data across the entire Lead/Client/Payment/Partner/Commission/Payout system
   */
  static async removeAllData(companyId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const [leads, clients, payments, commissions, payouts, partners] = await Promise.all([
      Lead.deleteMany({ companyId: compId }),
      ClientAccount.deleteMany({ companyId: compId }),
      PaymentRecord.deleteMany({ companyId: compId }),
      CommissionRecord.deleteMany({ companyId: compId }),
      PartnerPayout.deleteMany({ companyId: compId }),
      Partner.deleteMany({ companyId: compId }),
    ]);

    return {
      success: true,
      deleted: {
        leads: leads.deletedCount,
        clients: clients.deletedCount,
        payments: payments.deletedCount,
        commissions: commissions.deletedCount,
        payouts: payouts.deletedCount,
        partners: partners.deletedCount,
      },
    };
  }

  /**
   * Add Follow-Up note and date
   */
  static async addFollowUp(
    companyId: string,
    leadId: string,
    followUp: {
      date: Date | string;
      remarks: string;
      status?: string;
      stage?: string;
      isDead?: boolean;
      createdByName?: string;
    }
  ) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const followUpDate = new Date(followUp.date);
    const newEntry = {
      date: followUpDate,
      remarks: followUp.remarks,
      status: followUp.status || 'Pending',
      createdAt: new Date(),
      createdByName: followUp.createdByName || 'admin@lucknowbuilders.com',
    };

    lead.followUps.push(newEntry);
    lead.latestFollowUp = {
      date: followUpDate,
      remarks: followUp.remarks,
    };

    if (followUp.stage) {
      lead.stage = followUp.stage as any;
    }

    if (followUp.isDead !== undefined) {
      lead.isDead = followUp.isDead;
      if (followUp.isDead) {
        lead.stage = 'Dead';
        lead.deadReason = followUp.remarks || 'Marked dead via follow up';
        lead.deadAt = new Date();
      }
    }

    if (lead.stage === 'Client' && !lead.isDead && !lead.isRegisteredClient) {
      await LeadService.ensureClientAccount(companyId, lead, { notes: followUp.remarks });
    } else {
      await lead.save();
    }
    return lead;
  }

  /**
   * Mark lead as dead
   */
  static async markDead(companyId: string, leadId: string, reason: string) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.isDead = true;
    lead.deadReason = reason || 'Not Interested';
    lead.deadAt = new Date();
    lead.stage = 'Dead';

    await lead.save();
    return lead;
  }

  /**
   * Restore lead from dead
   */
  static async restoreDead(companyId: string, leadId: string) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.isDead = false;
    lead.deadReason = '';
    lead.deadAt = undefined;
    lead.stage = 'Lead';

    await lead.save();
    return lead;
  }

  /**
   * Register lead as converted client
   */
  static async convertToClient(
    companyId: string,
    leadId: string,
    clientData: {
      agreedAmount?: number;
      paidAmount?: number;
      notes?: string;
      clientName?: string;
      mobile1?: string;
      mobile2?: string;
      gender?: string;
      email?: string;
      permanentAddress?: string;
      siteLocation?: string;
      propertyType?: string;
      propertyTypeDetail?: string;
      landArea?: string;
      buildupArea?: string;
      dimensional?: string;
      facing?: string;
      level?: string;
      requirementType?: string;
      projectCost?: number;
      projectDuration?: string;
      meetingDateTime?: string | Date;
      serviceItems?: Array<{ service: string; specificItems?: string[] }>;
      priority?: string;
    }
  ) {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Apply any updated lead details from the Client Registration modal
    if (clientData.clientName) lead.clientName = clientData.clientName;
    if (clientData.mobile1) lead.mobile1 = clientData.mobile1;
    if (clientData.mobile2 !== undefined) lead.mobile2 = clientData.mobile2;
    if (clientData.gender) lead.gender = clientData.gender;
    if (clientData.email !== undefined) lead.email = clientData.email;
    if (clientData.permanentAddress !== undefined) lead.permanentAddress = clientData.permanentAddress;
    if (clientData.siteLocation) lead.siteLocation = clientData.siteLocation;
    if (clientData.propertyType) lead.propertyType = clientData.propertyType;
    if (clientData.propertyTypeDetail !== undefined) lead.propertyTypeDetail = clientData.propertyTypeDetail;
    if (clientData.landArea !== undefined) lead.landArea = clientData.landArea;
    if (clientData.buildupArea !== undefined) lead.buildupArea = clientData.buildupArea;
    if (clientData.dimensional !== undefined) lead.dimensional = clientData.dimensional;
    if (clientData.facing !== undefined) lead.facing = clientData.facing;
    if (clientData.level !== undefined) lead.level = clientData.level;
    if (clientData.requirementType !== undefined) lead.requirementType = clientData.requirementType;
    if (clientData.projectDuration !== undefined) lead.projectDuration = clientData.projectDuration;
    if (clientData.meetingDateTime) lead.meetingDateTime = new Date(clientData.meetingDateTime);
    if (clientData.priority) lead.priority = clientData.priority as any;
    if (clientData.serviceItems && clientData.serviceItems.length > 0) {
      lead.serviceItems = clientData.serviceItems;
      lead.requirements = clientData.serviceItems.map((s) => s.service).filter(Boolean);
    }
    if (clientData.projectCost !== undefined && clientData.projectCost !== null) {
      lead.finances = {
        ...lead.finances,
        budget: Number(clientData.projectCost) || 0,
      };
    }

    const agreedAmount =
      Number(clientData.projectCost) ||
      Number(clientData.agreedAmount) ||
      lead.finances?.budget ||
      0;
    const paidAmount = Number(clientData.paidAmount) || 0;
    const balanceAmount = Math.max(0, agreedAmount - paidAmount);

    const clientCode = `CL-${lead.leadCode}`;

    // Find linked reference partner if any
    let partner = null;
    if (lead.referenceDetails?.partnerId) {
      partner = await Partner.findOne({
        _id: lead.referenceDetails.partnerId,
        companyId: new mongoose.Types.ObjectId(companyId),
      });
    } else if (lead.referenceDetails?.partnerName) {
      partner = await Partner.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        name: new RegExp(`^${lead.referenceDetails.partnerName.trim()}$`, 'i'),
      });
    }

    const isFirstConversion = !lead.isRegisteredClient && !lead.convertedClientId;

    // Create or find client account
    let client = await ClientAccount.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      $or: [{ clientCode }, { leadId: lead._id }],
    });

    if (!client) {
      client = new ClientAccount({
        companyId: new mongoose.Types.ObjectId(companyId),
        leadId: lead._id,
        partnerId: partner?._id,
        partnerName: partner?.name || '',
        clientCode,
        name: lead.clientName,
        phone: lead.mobile1,
        secondaryPhone: lead.mobile2,
        email: lead.email,
        address: lead.permanentAddress,
        siteLocation: lead.siteLocation,
        companyName: lead.targetCompanyName || 'Lucknow Builders',
        projectType: lead.propertyType === 'Comm.' ? 'Commercial' : (lead.propertyType || 'Residential'),
        agreedAmount,
        paidAmount: 0,
        balanceAmount: agreedAmount,
        registrationDate: new Date(),
        status: 'Active',
        notes: clientData.notes || '',
      });
      await client.save();
    } else {
      client.name = lead.clientName;
      client.phone = lead.mobile1;
      client.secondaryPhone = lead.mobile2;
      client.email = lead.email;
      client.address = lead.permanentAddress;
      client.siteLocation = lead.siteLocation;
      client.agreedAmount = agreedAmount;
      if (partner) {
        client.partnerId = partner._id as any;
        client.partnerName = partner.name;
      }
      if (clientData.notes) client.notes = clientData.notes;
      await client.save();
    }

    // Update lead
    lead.isRegisteredClient = true;
    lead.convertedClientId = client._id as any;
    lead.stage = 'Client';
    lead.isDead = false;
    await lead.save();

    // If partner was referred and this is the first conversion, increment partner converted count
    if (isFirstConversion && partner) {
      partner.totalConverted = (partner.totalConverted || 0) + 1;
      await partner.save();
    }

    // If advance payment was made during registration, record it through centralized payment service
    if (paidAmount > 0) {
      await this.recordPayment(companyId, {
        clientId: client._id,
        leadId: lead._id,
        clientName: lead.clientName,
        amount: paidAmount,
        paymentDate: new Date(),
        paymentMode: 'UPI',
        modeBadge: 'Online',
        purpose: 'Advance Booking Payment',
        receivedBy: 'Admin',
      });
      // Refresh client after payment
      const refreshedClient = await ClientAccount.findById(client._id);
      if (refreshedClient) client = refreshedClient;
    }

    return { lead, client };
  }

  /**
   * Helper to ensure client account exists for a lead transitioned to Client stage
   */
  static async ensureClientAccount(companyId: string, lead: any, extraData: any = {}) {
    return await this.convertToClient(companyId, lead._id.toString(), {
      agreedAmount: lead.finances?.budget || 0,
      paidAmount: 0,
      siteLocation: lead.siteLocation || 'Site',
      notes: extraData.notes || lead.notes || '',
    });
  }

  /**
   * Get all clients with comprehensive filtering
   */
  static async getClients(
    companyId: string,
    query: {
      search?: string;
      statusMode?: 'NonDead' | 'Dead' | 'All';
      feeStatus?: 'All' | 'Paid' | 'Pending';
      company?: string;
      service?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const filter: any = { companyId: compId };

    // Dead / NonDead filter
    if (query.statusMode === 'Dead') {
      filter.isDead = true;
    } else if (query.statusMode === 'NonDead' || !query.statusMode) {
      filter.isDead = { $ne: true };
    }

    // Fee filter
    if (query.feeStatus === 'Paid') {
      filter.balanceAmount = { $lte: 0 };
      filter.agreedAmount = { $gt: 0 };
    } else if (query.feeStatus === 'Pending') {
      filter.balanceAmount = { $gt: 0 };
    }

    // Company filter
    if (query.company && query.company !== 'All Companies') {
      filter.$or = [
        { companyName: new RegExp(query.company, 'i') },
        { subBadge: new RegExp(query.company, 'i') },
      ];
    }

    // Service filter
    if (query.service && query.service !== 'All Services') {
      filter.services = new RegExp(query.service, 'i');
    }

    // Date range filter (Registration date)
    if (query.startDate || query.endDate) {
      filter.registrationDate = {};
      if (query.startDate) {
        filter.registrationDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.registrationDate.$lte = end;
      }
    }

    // Free text search
    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      const searchConditions = [
        { name: regex },
        { clientCode: regex },
        { phone: regex },
        { siteLocation: regex },
        { associate: regex },
        { handlerName: regex },
        { services: regex },
        { companyName: regex },
        { subBadge: regex },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const clients = await ClientAccount.find(filter)
      .sort({ registrationDate: -1, createdAt: -1 })
      .lean();
    return clients;
  }

  /**
   * Get single client by ID
   */
  static async getClientById(companyId: string, id: string) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();
    return client;
  }

  /**
   * Update client details
   */
  static async updateClient(companyId: string, id: string, data: any) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    if (data.name !== undefined) client.name = data.name;
    if (data.businessName !== undefined) client.businessName = data.businessName;
    if (data.contactPerson !== undefined) client.contactPerson = data.contactPerson;
    if (data.phone !== undefined) client.phone = data.phone;
    if (data.secondaryPhone !== undefined) client.secondaryPhone = data.secondaryPhone;
    if (data.email !== undefined) client.email = data.email;
    if (data.address !== undefined) client.address = data.address;
    if (data.siteLocation !== undefined) client.siteLocation = data.siteLocation;
    if (data.companyName !== undefined) client.companyName = data.companyName;
    if (data.handlerName !== undefined) client.handlerName = data.handlerName;
    if (data.subBadge !== undefined) client.subBadge = data.subBadge;
    if (data.associate !== undefined) client.associate = data.associate;
    if (data.associateType !== undefined) client.associateType = data.associateType;
    if (data.area !== undefined) client.area = data.area;
    if (data.services !== undefined) client.services = data.services;
    if (data.status !== undefined) client.status = data.status;
    if (data.notes !== undefined) client.notes = data.notes;

    // Site & Project details from Edit popup
    if (data.propertyType !== undefined) client.propertyType = data.propertyType;
    if (data.propertySubtype !== undefined) client.propertySubtype = data.propertySubtype;
    if (data.buildupArea !== undefined) client.buildupArea = data.buildupArea;
    if (data.dimensional !== undefined) client.dimensional = data.dimensional;
    if (data.facing !== undefined) client.facing = data.facing;
    if (data.level !== undefined) client.level = data.level;
    if (data.requirementType !== undefined) client.requirementType = data.requirementType;
    if (data.projectDuration !== undefined) client.projectDuration = data.projectDuration;
    if (data.meetingDate !== undefined) client.meetingDate = data.meetingDate;
    if (data.gender !== undefined) client.gender = data.gender;
    if (data.priority !== undefined) client.priority = data.priority;
    if (data.referenceSource !== undefined) client.referenceSource = data.referenceSource;
    if (data.servicesList !== undefined) client.servicesList = data.servicesList;
    if (data.registrationDate !== undefined) client.registrationDate = new Date(data.registrationDate);

    if (data.agreedAmount !== undefined) {
      client.agreedAmount = Number(data.agreedAmount) || 0;
      client.balanceAmount = Math.max(0, client.agreedAmount - (client.paidAmount || 0));
    }
    if (data.paidAmount !== undefined) {
      client.paidAmount = Number(data.paidAmount) || 0;
      client.balanceAmount = Math.max(0, (client.agreedAmount || 0) - client.paidAmount);
    }

    await client.save();
    return client;
  }

  /**
   * Save Cost Estimator and Initialize/Save Ledger Schedule
   */
  static async saveLedgerSchedule(
    companyId: string,
    clientId: string,
    estimatorData: {
      areaSqft: number;
      ratePerSqft: number;
      discountPerSqft: number;
      finalRate: number;
      totalAmount: number;
    },
    customStages?: any[]
  ) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(clientId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    const total = estimatorData.totalAmount || 0;
    client.projectEstimator = estimatorData;

    if (customStages && customStages.length > 0) {
      client.ledgerStages = customStages as any;
    } else if (!client.ledgerStages || client.ledgerStages.length === 0) {
      // 9 standard milestone stages breakdown matching user portal
      const defaultMilestones = [
        { stageName: 'Advance', percentage: 20 },
        { stageName: 'Slab', percentage: 20 },
        { stageName: 'Brick Work', percentage: 15 },
        { stageName: 'Electrical Work', percentage: 10 },
        { stageName: 'Plaster', percentage: 10 },
        { stageName: 'Tile Work', percentage: 10 },
        { stageName: 'Bathroom Fitting', percentage: 5 },
        { stageName: 'Painting Work', percentage: 5 },
        { stageName: 'Site Completion', percentage: 5 },
      ];

      const todayFormatted = new Date().toISOString().split('T')[0];
      client.ledgerStages = defaultMilestones.map((m) => {
        const stageAmount = Math.round((total * m.percentage) / 100);
        return {
          stageName: m.stageName,
          percentage: m.percentage,
          amount: stageAmount,
          targetDate: todayFormatted,
          paid: 0,
          due: stageAmount,
          status: 'Pending',
        } as any;
      });
    } else {
      // Re-scale existing stages to new total
      client.ledgerStages = client.ledgerStages.map((stage) => {
        const stageAmount = Math.round((total * (stage.percentage || 10)) / 100);
        const stagePaid = stage.paid || 0;
        return {
          ...stage,
          amount: stageAmount,
          due: Math.max(0, stageAmount - stagePaid),
          status: stagePaid >= stageAmount && stageAmount > 0 ? 'Paid' : stagePaid > 0 ? 'Partial' : 'Pending',
        };
      });
    }

    if (total > 0) {
      client.agreedAmount = total;
      const totalPaid = client.ledgerStages.reduce((sum, s) => sum + (s.paid || 0), 0);
      client.paidAmount = totalPaid;
      client.balanceAmount = Math.max(0, total - totalPaid);
    }

    await client.save();
    return client;
  }

  /**
   * Pay a specific ledger stage with cascading payments to next pending stages
   */
  static async payLedgerStage(
    companyId: string,
    clientId: string,
    stageId: string,
    amountToPay?: number,
    paymentMode: string = 'UPI',
    referenceNo?: string
  ) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(clientId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    // Auto-initialize 9 default stages if client has no schedule yet
    if (!client.ledgerStages || client.ledgerStages.length === 0) {
      const total = client.agreedAmount || 8000;
      const todayFormatted = '01-10-2026';
      const defaultStages = [
        { stageName: 'Advance', percentage: 20 },
        { stageName: 'Slab', percentage: 20 },
        { stageName: 'Brick Work', percentage: 15 },
        { stageName: 'Electrical Work', percentage: 10 },
        { stageName: 'Plaster', percentage: 10 },
        { stageName: 'Tile Work', percentage: 10 },
        { stageName: 'Bathroom Fitting', percentage: 5 },
        { stageName: 'Painting Work', percentage: 5 },
        { stageName: 'Site Completion', percentage: 5 },
      ];
      client.ledgerStages = defaultStages.map((s) => {
        const amt = Math.round((total * s.percentage) / 100);
        return {
          _id: new mongoose.Types.ObjectId(),
          stageName: s.stageName,
          percentage: s.percentage,
          amount: amt,
          targetDate: todayFormatted,
          paid: 0,
          due: amt,
          status: 'Pending',
        } as any;
      });
      await client.save();
    }

    // Safely find stage index by id, name, or index
    let stageIndex = -1;
    if (stageId) {
      stageIndex = client.ledgerStages.findIndex(
        (s: any) =>
          s._id?.toString() === stageId ||
          (s.stageName && s.stageName.toLowerCase() === stageId.toLowerCase())
      );
    }
    if (stageIndex === -1 && !isNaN(Number(stageId))) {
      const idx = Number(stageId);
      if (idx >= 0 && idx < client.ledgerStages.length) {
        stageIndex = idx;
      }
    }
    if (stageIndex === -1) {
      // Default to first pending stage
      stageIndex = client.ledgerStages.findIndex((s: any) => s.due > 0);
      if (stageIndex === -1) stageIndex = 0;
    }

    const requestedStage = client.ledgerStages[stageIndex];
    let remainingPay = amountToPay !== undefined ? Number(amountToPay) : (requestedStage.due || 0);
    const initialPay = remainingPay;

    if (remainingPay <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // "Payments cascade to next pending stage"
    // Allocate payment starting from this stage and flowing to subsequent pending stages
    for (let i = stageIndex; i < client.ledgerStages.length && remainingPay > 0; i++) {
      const currentStage = client.ledgerStages[i];
      if (currentStage.due > 0) {
        const alloc = Math.min(remainingPay, currentStage.due);
        currentStage.paid = (currentStage.paid || 0) + alloc;
        currentStage.due = Math.max(0, (currentStage.amount || 0) - currentStage.paid);
        currentStage.status = currentStage.due <= 0 ? 'Paid' : 'Partial';
        remainingPay -= alloc;
      }
    }

    // If remaining payment is still left, cascade to any earlier pending stages
    if (remainingPay > 0) {
      for (let i = 0; i < stageIndex && remainingPay > 0; i++) {
        const currentStage = client.ledgerStages[i];
        if (currentStage.due > 0) {
          const alloc = Math.min(remainingPay, currentStage.due);
          currentStage.paid = (currentStage.paid || 0) + alloc;
          currentStage.due = Math.max(0, (currentStage.amount || 0) - currentStage.paid);
          currentStage.status = currentStage.due <= 0 ? 'Paid' : 'Partial';
          remainingPay -= alloc;
        }
      }
    }

    // Recalculate client totals
    client.paidAmount = client.ledgerStages.reduce((sum, s) => sum + (s.paid || 0), 0);
    client.balanceAmount = Math.max(0, (client.agreedAmount || 0) - client.paidAmount);

    const actualRecorded = initialPay - remainingPay;

    // Record in PaymentRecord & auto-generate commission
    if (actualRecorded > 0) {
      const payment = await PaymentRecord.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        clientId: client._id,
        clientName: client.name,
        receiptNo: referenceNo || `RCP-${Date.now().toString().slice(-6)}`,
        amount: actualRecorded,
        paymentDate: new Date(),
        paymentMode,
        modeBadge: paymentMode === 'Cash' ? 'Cash' : 'Online',
        purpose: `${requestedStage.stageName} (Cascaded)`,
        receivedBy: 'Admin',
      });

      // Auto generate commission if client is referred by a partner
      await CommissionService.generateCommissionForPayment({
        companyId,
        paymentId: payment._id,
        clientId: client._id,
        paymentAmount: actualRecorded,
        receivedBy: 'Admin',
      });
    }

    await client.save();
    return client;
  }

  /**
   * Submit Daily Progress Report (DPR)
   */
  static async submitDailyProgressReport(
    companyId: string,
    clientId: string,
    dprData: {
      workCompletedToday: string;
      materialsUsed?: string;
      nextDayPlan?: string;
      siteKharcha?: { labourCost: number; materialCost: number };
      sitePhotos?: string[];
      reportedBy?: string;
    }
  ) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(clientId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    const report = {
      reportDate: new Date(),
      workCompletedToday: dprData.workCompletedToday,
      materialsUsed: dprData.materialsUsed || '',
      nextDayPlan: dprData.nextDayPlan || '',
      siteKharcha: dprData.siteKharcha || { labourCost: 0, materialCost: 0 },
      sitePhotos: dprData.sitePhotos || [],
      reportedBy: dprData.reportedBy || 'Admin',
      createdAt: new Date(),
    };

    client.dailyProgressReports = client.dailyProgressReports || [];
    client.dailyProgressReports.unshift(report as any);

    await client.save();
    return client;
  }

  /**
   * Add Follow-up to Client
   */
  static async addClientFollowUp(
    companyId: string,
    id: string,
    followUpData: {
      date: string | Date;
      remarks: string;
      status?: string;
      createdByName?: string;
    }
  ) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    const fDate = new Date(followUpData.date);
    const followUp = {
      date: fDate,
      remarks: followUpData.remarks,
      status: followUpData.status || 'Pending',
      createdAt: new Date(),
      createdByName: followUpData.createdByName || 'Admin',
    };

    client.followUps = client.followUps || [];
    client.followUps.unshift(followUp as any);
    client.latestFollowUp = {
      date: fDate,
      remarks: followUpData.remarks,
    };

    await client.save();
    return client;
  }

  /**
   * Mark Client as Dead
   */
  static async markClientDead(companyId: string, id: string, reason: string = '') {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    client.isDead = true;
    client.deadReason = reason;
    client.deadAt = new Date();
    client.status = 'Dead';

    if (reason) {
      client.followUps = client.followUps || [];
      client.followUps.unshift({
        date: new Date(),
        remarks: `Marked Dead: ${reason}`,
        status: 'Dead',
        createdAt: new Date(),
        createdByName: 'Admin',
      } as any);
      client.latestFollowUp = {
        date: new Date(),
        remarks: `Marked Dead: ${reason}`,
      };
    }

    await client.save();
    return client;
  }

  /**
   * Restore Dead Client
   */
  static async restoreClientDead(companyId: string, id: string) {
    const client = await ClientAccount.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) throw new Error('Client not found');

    client.isDead = false;
    client.deadReason = '';
    client.deadAt = undefined;
    client.status = 'Active';

    await client.save();
    return client;
  }

  /**
   * Delete Client
   */
  static async deleteClient(companyId: string, id: string) {
    const res = await ClientAccount.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Pre-seed 13 exact realistic clients from screenshot
   */
  static async seedRealisticClients(companyId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    await ClientAccount.deleteMany({ companyId: compId });
    await this.ensureInitialClients(companyId, true);
    return await this.getClients(companyId);
  }

  /**
   * Ensure Initial 13 Clients matching screenshot exist
   */
  static async ensureInitialClients(companyId: string, force: boolean = false) {
    const compId = new mongoose.Types.ObjectId(companyId);
    if (!force) {
      const count = await ClientAccount.countDocuments({ companyId: compId });
      if (count > 0) return;
    }

    const realClients = [
      {
        companyId: compId,
        clientCode: '000018',
        registrationDate: new Date('2026-09-29'),
        name: 'Dummy',
        subBadge: 'OLD INFRA',
        siteLocation: 'Dummy',
        associate: 'Social Media: Facebook',
        associateType: 'SocialMedia',
        area: '-',
        phone: '8427215202',
        services: 'Renovation',
        agreedAmount: 8000,
        paidAmount: 0,
        balanceAmount: 8000,
        status: 'Active',
        isDead: false,
        projectEstimator: {
          areaSqft: 100,
          ratePerSqft: 80,
          discountPerSqft: 0,
          finalRate: 80,
          totalAmount: 8000,
        },
        ledgerStages: [
          { stageName: 'Advance', percentage: 20, amount: 1600, targetDate: '01-10-2026', paid: 0, due: 1600, status: 'Pending' },
          { stageName: 'Slab', percentage: 20, amount: 1600, targetDate: '01-10-2026', paid: 0, due: 1600, status: 'Pending' },
          { stageName: 'Brick Work', percentage: 15, amount: 1200, targetDate: '01-10-2026', paid: 0, due: 1200, status: 'Pending' },
          { stageName: 'Electrical Work', percentage: 10, amount: 800, targetDate: '01-10-2026', paid: 0, due: 800, status: 'Pending' },
          { stageName: 'Plaster', percentage: 10, amount: 800, targetDate: '01-10-2026', paid: 0, due: 800, status: 'Pending' },
          { stageName: 'Tile Work', percentage: 10, amount: 800, targetDate: '01-10-2026', paid: 0, due: 800, status: 'Pending' },
          { stageName: 'Bathroom Fitting', percentage: 5, amount: 400, targetDate: '01-10-2026', paid: 0, due: 400, status: 'Pending' },
          { stageName: 'Painting Work', percentage: 5, amount: 400, targetDate: '01-10-2026', paid: 0, due: 400, status: 'Pending' },
          { stageName: 'Site Completion', percentage: 5, amount: 400, targetDate: '01-10-2026', paid: 0, due: 400, status: 'Pending' },
        ],
        followUps: [
          {
            date: new Date('2026-09-30'),
            remarks: 'No Remark',
            status: 'Pending',
            createdAt: new Date('2026-09-29T10:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-30'),
          remarks: 'No Remark',
        },
      },
      {
        companyId: compId,
        clientCode: '000017',
        registrationDate: new Date('2026-09-26'),
        name: 'Sunil Kumar Singh',
        siteLocation: 'Near PGI',
        associate: 'Google',
        associateType: 'Direct',
        area: '-',
        phone: '8427215202',
        services: 'Construction Structure',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-07-29'),
            remarks: 'Meeting done and work start from august',
            status: 'Pending',
            createdAt: new Date('2026-09-26T11:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-07-29'),
          remarks: 'Meeting done and work start from august',
        },
      },
      {
        companyId: compId,
        clientCode: '000016',
        registrationDate: new Date('2026-06-23'),
        name: 'Harshit Sahu',
        siteLocation: 'Barabanki Haidergarh',
        associate: 'Social Media: Facebook',
        associateType: 'SocialMedia',
        area: '2,000',
        phone: '8307442475',
        services: 'Floor Plan Design',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-06-09'),
            remarks: 'he is saying that he will visit the office tuesday for meeting',
            status: 'Pending',
            createdAt: new Date('2026-06-23T12:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-06-09'),
          remarks: 'he is saying that he will visit the office tuesday for meeting',
        },
      },
      {
        companyId: compId,
        clientCode: '000015',
        registrationDate: new Date('2026-06-23'),
        name: 'Abhishek Shreeliya',
        subBadge: 'LB',
        handlerName: 'ER. Ankit Kumar Verma',
        siteLocation: 'Khargapur',
        associate: 'Direct',
        associateType: 'SocialMedia',
        area: '2,475',
        phone: '70522 00007',
        services: 'Construction Furnished',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-07-01'),
            remarks: 'Meeting done work start from after june',
            status: 'Pending',
            createdAt: new Date('2026-06-23T14:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-07-01'),
          remarks: 'Meeting done work start from after june',
        },
      },
      {
        companyId: compId,
        clientCode: '000014',
        registrationDate: new Date('2026-04-01'),
        name: 'Upendra Soni',
        siteLocation: 'Rajajipuram, Near Balaji Mandir, Lucknow',
        associate: 'PI ADS',
        associateType: 'Direct',
        area: '330',
        phone: '6393916514',
        services: 'Interior Full Design',
        agreedAmount: 10000,
        paidAmount: 5000,
        balanceAmount: 5000,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-02-17'),
            remarks: 'The lead is being handled by satyapal',
            status: 'Pending',
            createdAt: new Date('2026-04-01T15:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-02-17'),
          remarks: 'The lead is being handled by satyapal',
        },
      },
      {
        companyId: compId,
        clientCode: '000013',
        registrationDate: new Date('2026-03-20'),
        name: 'Sandeep Singh Near amrity university 101',
        siteLocation: 'Amity Green, Amity University, Lucknow',
        associate: 'CNK ads 1.20/-',
        associateType: 'Direct',
        area: '200',
        phone: '9305233132',
        services: 'Renovation, Interior Work',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-02-18'),
            remarks: 'Friday visit office at 5:00 PM discussion with sir.',
            status: 'Pending',
            createdAt: new Date('2026-03-20T16:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-02-18'),
          remarks: 'Friday visit office at 5:00 PM discussion with sir.',
        },
      },
      {
        companyId: compId,
        clientCode: '000012',
        registrationDate: new Date('2026-03-20'),
        name: 'Suman Singh w/o Aditya Singh w/o Anil Singh',
        siteLocation: 'Vishnupuri Colony, Neelmatha, Medanta Infra, Lucknow',
        associate: 'LB Meta ads',
        associateType: 'Direct',
        area: '830',
        phone: '8118899184',
        services: 'Construction Furnished',
        agreedAmount: 1411000,
        paidAmount: 4100,
        balanceAmount: 1406900,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-02-10'),
            remarks: 'They said they want to start the construction work from the 20th, will come to the office for meeting on Thursday',
            status: 'Pending',
            createdAt: new Date('2026-03-20T17:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-02-10'),
          remarks: 'They said they want to start the construction work from the 20th, will come to the office for meeting on Thursday',
        },
      },
      {
        companyId: compId,
        clientCode: '000011',
        registrationDate: new Date('2026-03-20'),
        name: 'Akash Gaikwad',
        siteLocation: 'Maharashtra',
        associate: 'PI Meta ads 1.5/-',
        associateType: 'Direct',
        area: '-',
        phone: '8007675848',
        services: 'Interior Full Design, Elevation Design',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [],
        latestFollowUp: {
          remarks: 'No Remark',
        },
      },
      {
        companyId: compId,
        clientCode: '000010',
        registrationDate: new Date('2026-03-20'),
        name: 'Santosh Kumar and Anuj Ji',
        siteLocation: 'Sultanpur Road',
        associate: 'NITCO Tiles',
        associateType: 'Direct',
        area: '12,000',
        phone: '6392327595',
        services: 'Construction, Floor Plan Design',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-01-15'),
            remarks: 'He is saying that sunday visit office for meeting discussion plan layout and estimate cost amount',
            status: 'Pending',
            createdAt: new Date('2026-03-20T11:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-01-15'),
          remarks: 'He is saying that sunday visit office for meeting discussion plan layout and estimate cost amount',
        },
      },
      {
        companyId: compId,
        clientCode: '000009',
        registrationDate: new Date('2026-03-20'),
        name: 'Adv. Sandeep Shukla Khargapur',
        siteLocation: 'Geetapuri Colony, Gomti Nagar Vistar, Lucknow',
        associate: 'Google',
        associateType: 'Direct',
        area: '-',
        phone: '7938018809',
        services: 'Construction Furnished',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-01-05'),
            remarks: 'They have already had a meeting with sir. They came for the meeting, visited the office and the site, and the mapping has also been completed. They will come to the office after which everything will be finalized to start the work.',
            status: 'Pending',
            createdAt: new Date('2026-03-20T13:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-01-05'),
          remarks: 'They have already had a meeting with sir. They came for the meeting, visited the office and the site, and the mapping has also been completed. They will come to the office after which everything will be finalized to start the work.',
        },
      },
      {
        companyId: compId,
        clientCode: '000007',
        registrationDate: new Date('2026-03-20'),
        name: 'Saurabh Gupta',
        handlerName: 'ER. Tridev Sharma',
        siteLocation: 'Gorakhpur',
        associate: 'ads',
        associateType: 'Direct',
        area: '4,000',
        phone: '8374427456',
        services: 'Renovation',
        agreedAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2026-09-06'),
            remarks: 'he will go djp at dashara so we can also go on that time to site visit and also he wants our portfolio and projects image',
            status: 'Pending',
            createdAt: new Date('2026-03-20T14:30:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-06'),
          remarks: 'he will go djp at dashara so we can also go on that time to site visit and also he wants our portfolio and projects image',
        },
      },
      {
        companyId: compId,
        clientCode: '000006',
        registrationDate: new Date('2026-03-20'),
        name: 'Vicky Ji',
        siteLocation: 'Ayodhya',
        associate: 'Google',
        associateType: 'Direct',
        area: '1,500',
        phone: '6393275803',
        services: 'Elevation Design',
        agreedAmount: 120000,
        paidAmount: 0,
        balanceAmount: 120000,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2025-11-22'),
            remarks: 'He is looking for G+1 Elevation design, 20*60 sqft area, west facing, In Ayodhya 5000 cost told by Oum Sir. Client need some samples and sketchup',
            status: 'Pending',
            createdAt: new Date('2026-03-20T15:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2025-11-22'),
          remarks: 'He is looking for G+1 Elevation design, 20*60 sqft area, west facing, In Ayodhya 5000 cost told by Oum Sir. Client need some samples and sketchup',
        },
      },
      {
        companyId: compId,
        clientCode: '000001',
        registrationDate: new Date('2026-03-19'),
        name: 'Anurag',
        siteLocation: 'Renovation',
        associate: 'ads',
        associateType: 'Direct',
        area: '-',
        phone: '9399690013',
        services: 'Renovation',
        agreedAmount: 912900,
        paidAmount: 0,
        balanceAmount: 912900,
        status: 'Active',
        isDead: false,
        followUps: [
          {
            date: new Date('2025-08-23'),
            remarks: 'he is our client',
            status: 'Pending',
            createdAt: new Date('2026-03-19T18:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2025-08-23'),
          remarks: 'he is our client',
        },
      },
    ];

    await ClientAccount.insertMany(realClients);
  }

  /**
   * Get all payments with filters and ensure initial payments
   */
  static async getPayments(
    companyId: string,
    filter?: { search?: string; startDate?: string; endDate?: string; limit?: number }
  ) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const query: any = { companyId: compId };

    if (filter?.search && filter.search.trim()) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { clientName: regex },
        { receiptNo: regex },
        { transactionRef: regex },
        { serviceName: regex },
        { servicePlan: regex },
        { remarks: regex },
        { purpose: regex },
      ];
    }

    if (filter?.startDate || filter?.endDate) {
      query.paymentDate = {};
      if (filter.startDate) {
        query.paymentDate.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 50;

    const payments = await PaymentRecord.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return payments;
  }

  /**
   * Record a payment (money received FROM Client)
   * Automatically updates client balance and generates commission if partner exists
   */
  static async recordPayment(companyId: string, paymentData: any) {
    const receiptNo = paymentData.receiptNo || `RCP-${Date.now().toString().slice(-6)}`;
    const compId = new mongoose.Types.ObjectId(companyId);

    const payment = new PaymentRecord({
      ...paymentData,
      companyId: compId,
      receiptNo,
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
      modeBadge: paymentData.modeBadge || (paymentData.paymentMode === 'Cash' ? 'Cash' : 'Online'),
    });

    await payment.save();

    // If client account ID is provided, update client paidAmount and balanceAmount
    if (paymentData.clientId) {
      const client = await ClientAccount.findOne({ _id: paymentData.clientId, companyId: compId });
      if (client) {
        client.paidAmount = (client.paidAmount || 0) + paymentData.amount;
        client.balanceAmount = Math.max(0, (client.agreedAmount || 0) - client.paidAmount);
        await client.save();
      }
    }

    // Automatically generate commission if client is referred by a reference partner
    try {
      await CommissionService.generateCommissionForPayment({
        companyId: compId,
        paymentId: payment._id,
        clientId: paymentData.clientId,
        paymentAmount: payment.amount,
        receivedBy: paymentData.receivedBy || 'Admin',
      });
    } catch (commErr) {
      console.error('Commission auto-generation warning:', commErr);
    }

    return payment;
  }

  /**
   * Get Reference Partners & stats
   */
  static async getPartners(companyId: string) {
    const partners = await Partner.find({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean();
    return partners;
  }

  /**
   * Delete Partner
   */
  static async deletePartner(companyId: string, partnerId: string) {
    const res = await Partner.deleteOne({
      _id: new mongoose.Types.ObjectId(partnerId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Delete all Partners
   */
  static async deleteAllPartners(companyId: string) {
    const res = await Partner.deleteMany({
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res;
  }

  /**
   * Create Partner
   */
  static async createPartner(companyId: string, partnerData: any) {
    const partner = new Partner({
      ...partnerData,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    await partner.save();
    return partner;
  }

  /**
   * Update Partner
   */
  static async updatePartner(companyId: string, partnerId: string, updateData: any) {
    const partner = await Partner.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(partnerId),
        companyId: new mongoose.Types.ObjectId(companyId),
      },
      { $set: updateData },
      { new: true }
    );
    if (!partner) throw new Error('Partner not found');
    return partner;
  }

  /**
   * Get Unified Commission Reports
   */
  static async getCommissionReports(companyId: string, partnerId?: string) {
    return await CommissionService.getCommissionReports(companyId, partnerId);
  }

  /**
   * Approve Commission (Admin Workflow)
   */
  static async approveCommission(companyId: string, commissionId: string, approvedBy: string = 'Admin') {
    return await CommissionService.approveCommission(companyId, commissionId, approvedBy);
  }

  /**
   * Pay Amount: Disburse payout TO Reference Partner
   */
  static async processPayout(companyId: string, payoutData: any) {
    return await CommissionService.processPayout(companyId, payoutData);
  }

  /**
   * Get Partner Payouts history
   */
  static async getPayouts(companyId: string, filter?: { partnerId?: string; search?: string }) {
    return await CommissionService.getPayouts(companyId, filter);
  }

  /**
   * Get full connected Dossier: Client → Lead → Payments → Partner → Commission → Payouts
   */
  static async getClientDossier(companyId: string, clientId: string) {
    return await CommissionService.getClientDossier(companyId, clientId);
  }

  /**
   * Ensure reference partners exist
   */
  static async ensureInitialPartners(companyId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const count = await Partner.countDocuments({ companyId: compId });
    if (count > 0) return;

    const defaultPartners = [
      {
        companyId: compId,
        name: 'Apex Realty Partners',
        phone: '98765 43210',
        email: 'apex@realty.com',
        partnerType: 'Channel Partner',
        commissionRatePercent: 2.5,
        totalLeadsReferred: 14,
        totalConverted: 3,
        totalCommissionEarned: 185000,
        totalCommissionPaid: 150000,
      },
      {
        companyId: compId,
        name: 'Rajesh Sharma Associates',
        phone: '98112 34567',
        email: 'rajesh.partners@gmail.com',
        partnerType: 'Associate',
        commissionRatePercent: 2.0,
        totalLeadsReferred: 8,
        totalConverted: 2,
        totalCommissionEarned: 120000,
        totalCommissionPaid: 120000,
      },
      {
        companyId: compId,
        name: 'Urban Infra Advisors',
        phone: '94560 12345',
        email: 'info@urbaninfra.co.in',
        partnerType: 'Broker',
        commissionRatePercent: 3.0,
        totalLeadsReferred: 6,
        totalConverted: 1,
        totalCommissionEarned: 95000,
        totalCommissionPaid: 50000,
      },
    ];

    await Partner.insertMany(defaultPartners);
  }

  /**
   * Pre-seed real data exactly matching Image 2 screenshot
   */
  static async ensureInitialSeedData(companyId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const count = await Lead.countDocuments({ companyId: compId });
    if (count > 0) return;

    await this.ensureInitialPartners(companyId);

    // Exact realistic leads from Image 2
    const realLeads = [
      {
        companyId: compId,
        leadCode: '001261',
        leadDate: new Date('2026-09-29'),
        clientName: 'Srikant',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Business',
        mobile1: '94575 12844',
        mobile2: '94575 12840',
        email: 'srikant.biz@gmail.com',
        permanentAddress: 'Sector D, Aliganj, Lucknow',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '',
        buildupArea: '',
        dimensional: '',
        facing: 'East',
        level: 'Grnd/1st',
        meetingDateTime: new Date('2026-09-30T11:00:00'),
        finances: { budget: 4500000, estimatedCost: 4800000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook', notes: 'Facebook Lead Campaign' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-30'),
            remarks: 'Call not picked.',
            status: 'Pending',
            createdAt: new Date('2026-09-29T10:30:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-30'),
          remarks: 'Call not picked.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001260',
        leadDate: new Date('2026-09-29'),
        clientName: 'Susheel Kumar',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Govt. Employee',
        mobile1: '97662 88785',
        siteLocation: 'Banda',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '1,500',
        buildupArea: '30x50',
        dimensional: '30x50',
        facing: 'North',
        level: 'Grnd/1st',
        meetingDateTime: new Date('2026-10-01T15:00:00'),
        finances: { budget: 3800000, estimatedCost: 4000000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Other', notes: 'Social Media: Other' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-10-01'),
            remarks: 'Need qoutation',
            status: 'Pending',
            createdAt: new Date('2026-09-29T11:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-10-01'),
          remarks: 'Need qoutation',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001259',
        leadDate: new Date('2026-09-28'),
        clientName: 'Piyush Mishra',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Engineer',
        mobile1: '80097 95588',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        facing: 'East',
        level: 'Grnd/1st',
        finances: { budget: 5200000, estimatedCost: 5500000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-10-04'),
            remarks: 'She is busy right now.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T14:20:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-10-04'),
          remarks: 'She is busy right now.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001258',
        leadDate: new Date('2026-09-28'),
        clientName: 'H. Narayan',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Advocate',
        mobile1: '63882 19091',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        facing: 'North-East',
        level: 'Grnd/1st',
        finances: { budget: 4200000, estimatedCost: 4500000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Call not picked.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T16:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Call not picked.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001257',
        leadDate: new Date('2026-09-28'),
        clientName: 'Aveesh Singh',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Doctor',
        mobile1: '73551 55860',
        siteLocation: 'Shahjahanpur',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '1,380',
        buildupArea: '30x46',
        dimensional: '30x46',
        facing: 'East',
        level: 'Grnd/1st',
        finances: { budget: 6000000, estimatedCost: 6200000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Meeting',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-10-22'),
            remarks: 'Meeting schedule after navratri',
            status: 'Scheduled',
            createdAt: new Date('2026-09-28T17:30:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-10-22'),
          remarks: 'Meeting schedule after navratri',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001256',
        leadDate: new Date('2026-09-28'),
        clientName: 'Preeti',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Teacher',
        mobile1: '63755 48072',
        siteLocation: 'Jetha Road',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '1,350',
        buildupArea: '27x50',
        dimensional: '27x50',
        facing: 'West',
        level: 'Grnd/1st',
        finances: { budget: 3500000, estimatedCost: 3600000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'She is saying need qoutation.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T18:10:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'She is saying need qoutation.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001255',
        leadDate: new Date('2026-09-28'),
        clientName: 'Satyam Chauhan',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Private Job',
        mobile1: '90051 30214',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        facing: 'North',
        level: 'Grnd/1st',
        finances: { budget: 3200000, estimatedCost: 3300000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Disconnect the call.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T11:20:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Disconnect the call.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001254',
        leadDate: new Date('2026-09-28'),
        clientName: 'Vikas',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Business',
        mobile1: '94562 55560',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        finances: { budget: 4100000, estimatedCost: 4200000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Call not picked.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T12:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Call not picked.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001253',
        leadDate: new Date('2026-09-28'),
        clientName: 'Ajay',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Business',
        mobile1: '63922 40793',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        finances: { budget: 2800000, estimatedCost: 3000000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Call not picked.',
            status: 'Pending',
            createdAt: new Date('2026-09-28T12:45:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Call not picked.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001252',
        leadDate: new Date('2026-09-27'),
        clientName: 'Saurabh Srivastav',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Engineer',
        mobile1: '91407 11470',
        siteLocation: 'Agra',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        finances: { budget: 4800000, estimatedCost: 5000000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Other' },
        stage: 'Lead',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Need estimate',
            status: 'Pending',
            createdAt: new Date('2026-09-27T10:15:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Need estimate',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001251',
        leadDate: new Date('2026-09-27'),
        clientName: 'Dr. Mragendra Singh',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Doctor',
        mobile1: '78285 27796',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        finances: { budget: 7500000, estimatedCost: 7800000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Call disconnect',
            status: 'Pending',
            createdAt: new Date('2026-09-27T14:30:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Call disconnect',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001250',
        leadDate: new Date('2026-09-27'),
        clientName: 'Krishna Kant Yadav',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Advocate',
        mobile1: '73551 04344',
        siteLocation: 'GG',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        finances: { budget: 3500000, estimatedCost: 3700000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'Normal',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Call not picked.',
            status: 'Pending',
            createdAt: new Date('2026-09-27T16:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Call not picked.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001249',
        leadDate: new Date('2026-09-26'),
        clientName: 'Vikas',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Business',
        mobile1: '80001 46299',
        siteLocation: 'Raibarel',
        requirements: ['Construction Furnished'],
        propertyType: 'Comm.',
        landArea: '29,000',
        buildupArea: '150x190',
        dimensional: '150x190',
        facing: 'North',
        level: 'Grnd/1st',
        finances: { budget: 25000000, estimatedCost: 26500000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Meeting',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-10-01'),
            remarks: 'Call not picked message dropped on whatsapp.',
            status: 'Pending',
            createdAt: new Date('2026-09-26T11:45:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-10-01'),
          remarks: 'Call not picked message dropped on whatsapp.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001248',
        leadDate: new Date('2026-09-26'),
        clientName: 'Avishesh Kumar',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Govt. Employee',
        mobile1: '99183 36331',
        siteLocation: 'Banthra',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '1,343',
        buildupArea: '25x53',
        dimensional: '25x53',
        facing: 'East',
        level: 'Grnd/1st',
        finances: { budget: 3600000, estimatedCost: 3800000 },
        referenceType: 'Social Media',
        referenceDetails: { channel: 'Facebook' },
        stage: 'Lead',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-09-30'),
            remarks: 'Registry pending right now',
            status: 'Pending',
            createdAt: new Date('2026-09-26T15:20:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-30'),
          remarks: 'Registry pending right now',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001247',
        leadDate: new Date('2026-09-25'),
        clientName: 'Manoj Kumar Gupta',
        targetCompanyCode: 'LB',
        targetCompanyName: 'Lucknow Builders',
        occupation: 'Business',
        mobile1: '98390 11223',
        siteLocation: 'Gomti Nagar Extension',
        requirements: ['Construction Furnished', 'Architectural Design'],
        propertyType: 'Resi.',
        landArea: '2,150',
        buildupArea: '40x53',
        dimensional: '40x53',
        facing: 'North-East',
        level: 'G+2',
        finances: { budget: 8500000, estimatedCost: 8800000 },
        referenceType: 'Associate',
        referenceDetails: { partnerName: 'Apex Realty Partners' },
        stage: 'Quotation',
        priority: 'High',
        followUps: [
          {
            date: new Date('2026-09-29'),
            remarks: 'Quotation revision sent via email.',
            status: 'Completed',
            createdAt: new Date('2026-09-25T11:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-29'),
          remarks: 'Quotation revision sent via email.',
        },
        isDead: false,
      },
      {
        companyId: compId,
        leadCode: '001246',
        leadDate: new Date('2026-09-24'),
        clientName: 'Rameshwar Dayal',
        targetCompanyCode: 'LD',
        targetCompanyName: 'Lucknow Developers',
        occupation: 'Private Job',
        mobile1: '94150 44556',
        siteLocation: 'Faizabad Road',
        requirements: ['Construction Furnished'],
        propertyType: 'Resi.',
        landArea: '1,200',
        buildupArea: '24x50',
        dimensional: '24x50',
        facing: 'East',
        level: 'Grnd/1st',
        finances: { budget: 2800000, estimatedCost: 2900000 },
        referenceType: 'Direct',
        referenceDetails: { notes: 'Direct lead, no external referral attribution.' },
        stage: 'Dead',
        priority: 'Low',
        isDead: true,
        deadReason: 'Budget mismatch, postponing construction till next year.',
        deadAt: new Date('2026-09-26'),
        followUps: [
          {
            date: new Date('2026-09-26'),
            remarks: 'Client postponed project. Marked dead.',
            status: 'Closed',
            createdAt: new Date('2026-09-26T16:00:00'),
            createdByName: 'Admin',
          },
        ],
        latestFollowUp: {
          date: new Date('2026-09-26'),
          remarks: 'Client postponed project. Marked dead.',
        },
      },
    ];

    await Lead.insertMany(realLeads);

    // Convert one lead to active client for demonstration
    const sampleLead = await Lead.findOne({ companyId: compId, leadCode: '001247' });
    if (sampleLead) {
      await ClientAccount.create({
        companyId: compId,
        leadId: sampleLead._id,
        clientCode: `CL-${sampleLead.leadCode}`,
        name: sampleLead.clientName,
        phone: sampleLead.mobile1,
        siteLocation: sampleLead.siteLocation,
        companyName: sampleLead.targetCompanyName || 'Lucknow Builders',
        projectType: 'Residential',
        agreedAmount: 8500000,
        paidAmount: 1500000,
        balanceAmount: 7000000,
        registrationDate: new Date('2026-09-25'),
        status: 'Active',
      });

      await PaymentRecord.create({
        companyId: compId,
        clientName: sampleLead.clientName,
        receiptNo: 'RCP-2026-0042',
        amount: 1500000,
        paymentDate: new Date('2026-09-25'),
        paymentMode: 'NEFT/RTGS',
        transactionRef: 'UTR9988221100',
        purpose: 'Advance Booking & Foundation Milestone',
        receivedBy: 'Admin',
      });
    }
  }
}
