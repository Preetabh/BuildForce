import mongoose from 'mongoose';
import { Lead, ILead } from '../../models/Lead';
import { Partner } from '../../models/Partner';
import { ClientAccount } from '../../models/ClientAccount';
import { PaymentRecord } from '../../models/PaymentRecord';
import { CommissionRecord } from '../../models/CommissionRecord';
import { Company } from '../../models/Company';

export interface LeadFilterParams {
  search?: string;
  statusMode?: 'NonDead' | 'Dead' | 'All';
  companyCode?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  stage?: string;
  priority?: string;
  view?: 'list' | 'today-due' | 'process';
  page?: number;
  limit?: number;
}

export class LeadService {
  /**
   * Fetch leads with full filter and pagination support
   */
  static async getLeads(companyId: string, params: LeadFilterParams) {
    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };

    // 1. Status mode (NonDead / Dead / All)
    if (params.statusMode === 'Dead') {
      query.isDead = true;
    } else if (params.statusMode === 'All') {
      // Don't filter by isDead
    } else {
      // Default: NonDead
      query.isDead = false;
    }

    // 2. Search
    if (params.search && params.search.trim()) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { clientName: searchRegex },
        { leadCode: searchRegex },
        { mobile1: searchRegex },
        { mobile2: searchRegex },
        { siteLocation: searchRegex },
        { 'referenceDetails.partnerName': searchRegex },
        { 'referenceDetails.channel': searchRegex },
        { 'referenceDetails.employeeName': searchRegex },
      ];
    }

    // 3. Company code filter (LB / LD / All)
    if (params.companyCode && params.companyCode !== 'All Companies' && params.companyCode !== 'ALL') {
      query.targetCompanyCode = params.companyCode;
    }

    // 4. Service filter
    if (params.service && params.service !== 'All Services' && params.service !== 'ALL') {
      query.requirements = { $in: [params.service] };
    }

    // 5. Stage filter
    if (params.stage && params.stage !== 'ALL') {
      query.stage = params.stage;
    }

    // 6. Priority filter
    if (params.priority && params.priority !== 'ALL') {
      query.priority = params.priority;
    }

    // 7. Date range filter on leadDate
    if (params.startDate || params.endDate) {
      query.leadDate = {};
      if (params.startDate) {
        query.leadDate.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        query.leadDate.$lte = end;
      }
    }

    // 8. View: today-due filter
    if (params.view === 'today-due') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      query['latestFollowUp.date'] = { $lte: endOfDay };
    }

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

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
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
      Lead.countDocuments({ companyId: compId, isDead: false }),
      Lead.countDocuments({ companyId: compId, isDead: true }),
      Lead.countDocuments({ companyId: compId, stage: 'Client' }),
      Lead.countDocuments({
        companyId: compId,
        isDead: false,
        'latestFollowUp.date': { $lte: endOfDay },
      }),
    ]);

    return {
      totalActive,
      totalDead,
      totalClients,
      todayDueCount,
      totalAll: totalActive + totalDead,
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

    await lead.save();
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

    await lead.save();
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

    // Create or find client account
    let client = await ClientAccount.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      clientCode,
    });

    if (!client) {
      client = new ClientAccount({
        companyId: new mongoose.Types.ObjectId(companyId),
        leadId: lead._id,
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
        paidAmount,
        balanceAmount,
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
      client.paidAmount = paidAmount;
      client.balanceAmount = balanceAmount;
      if (clientData.notes) client.notes = clientData.notes;
      await client.save();
    }

    // Update lead
    lead.isRegisteredClient = true;
    lead.convertedClientId = client._id as any;
    lead.stage = 'Client';
    lead.isDead = false;
    await lead.save();

    // If partner was referred, update partner converted count and commission
    if (lead.referenceType === 'Associate' && lead.referenceDetails?.partnerName) {
      const partner = await Partner.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        name: lead.referenceDetails.partnerName,
      });

      if (partner) {
        partner.totalConverted += 1;
        const commissionAmount = (agreedAmount * (partner.commissionRatePercent || 2)) / 100;
        partner.totalCommissionEarned += commissionAmount;
        await partner.save();

        // Create commission record
        await CommissionRecord.create({
          companyId: new mongoose.Types.ObjectId(companyId),
          partnerId: partner._id,
          partnerName: partner.name,
          leadId: lead._id,
          leadCode: lead.leadCode,
          clientName: lead.clientName,
          projectValue: agreedAmount,
          commissionPercent: partner.commissionRatePercent || 2,
          commissionAmount,
          status: 'Pending',
        });
      }
    }

    // If advance payment was made during registration, record it
    if (paidAmount > 0) {
      await PaymentRecord.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        clientId: client._id,
        leadId: lead._id,
        clientName: lead.clientName,
        receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
        amount: paidAmount,
        paymentDate: new Date(),
        paymentMode: 'UPI',
        purpose: 'Advance Booking Payment',
        receivedBy: 'Admin',
      });
    }

    return { lead, client };
  }

  /**
   * Get all converted clients
   */
  static async getClients(companyId: string, search?: string) {
    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { clientCode: regex }, { phone: regex }, { siteLocation: regex }];
    }

    const clients = await ClientAccount.find(query).sort({ createdAt: -1 }).lean();
    return clients;
  }

  /**
   * Get all payments
   */
  static async getPayments(companyId: string, search?: string) {
    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ clientName: regex }, { receiptNo: regex }, { transactionRef: regex }, { purpose: regex }];
    }

    const payments = await PaymentRecord.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean();
    return payments;
  }

  /**
   * Record a payment (Pay Amount feature)
   */
  static async recordPayment(companyId: string, paymentData: any) {
    const receiptNo = paymentData.receiptNo || `RCP-${Date.now().toString().slice(-6)}`;
    const compId = new mongoose.Types.ObjectId(companyId);

    const payment = new PaymentRecord({
      ...paymentData,
      companyId: compId,
      receiptNo,
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
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
   * Get Commission Reports
   */
  static async getCommissionReports(companyId: string, partnerId?: string) {
    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (partnerId) {
      query.partnerId = new mongoose.Types.ObjectId(partnerId);
    }

    const reports = await CommissionRecord.find(query).sort({ createdAt: -1 }).lean();

    const summary = reports.reduce(
      (acc, curr) => {
        acc.totalCommission += curr.commissionAmount;
        if (curr.status === 'Paid') acc.paidCommission += curr.commissionAmount;
        if (curr.status === 'Pending') acc.pendingCommission += curr.commissionAmount;
        return acc;
      },
      { totalCommission: 0, paidCommission: 0, pendingCommission: 0 }
    );

    return { reports, summary };
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
