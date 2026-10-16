import { Request, Response, NextFunction } from 'express';
import { LeadService } from './lead.service';
import { checkUserPermission } from '../../middleware/rbac.middleware';
import { AuditService } from '../audit/audit.service';

export class LeadController {
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const canViewAll = await checkUserPermission(
        req.user!.userId,
        companyId,
        req.user!.role,
        ['Admin/ViewAllLeads', 'lead.view_all', 'Admin/Management_All']
      );

      const {
        search,
        statusMode,
        companyCode,
        service,
        startDate,
        endDate,
        date,
        stage,
        priority,
        view,
        page,
        limit,
        userId,
        viewingUserId,
        selectedUserId,
        userName,
        todayOnly,
      } = req.query;

      // If user lacks permission to view all organization leads, enforce scoping to their own identity
      let targetUserId: string | undefined;
      let targetUserName: string | undefined;

      if (canViewAll) {
        targetUserId = (viewingUserId || selectedUserId || userId) as string;
        targetUserName = userName as string;
      } else {
        targetUserId = req.user!.userId;
        targetUserName = req.user!.name;
      }

      const result = await LeadService.getLeads(companyId, {
        search: search as string,
        statusMode: statusMode as any,
        companyCode: companyCode as string,
        service: service as string,
        startDate: startDate as string,
        endDate: endDate as string,
        date: date as string,
        stage: stage as string,
        priority: priority as string,
        view: view as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        userId: targetUserId,
        viewingUserId: targetUserId,
        selectedUserId: targetUserId,
        userName: targetUserName,
        todayOnly: todayOnly === 'true' || (todayOnly as any) === true,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadStats(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const canViewAll = await checkUserPermission(
        req.user!.userId,
        companyId,
        req.user!.role,
        ['Admin/ViewAllLeads', 'lead.view_all', 'Admin/Management_All']
      );

      let targetUserId: string | undefined;
      let targetUserName: string | undefined;

      if (canViewAll) {
        targetUserId = (req.query.viewingUserId || req.query.selectedUserId || req.query.userId) as string;
        targetUserName = req.query.userName as string;
      } else {
        targetUserId = req.user!.userId;
        targetUserName = req.user!.name;
      }

      const filterUser = (targetUserId || targetUserName)
        ? { userId: targetUserId, userName: targetUserName }
        : undefined;

      const stats = await LeadService.getLeadStats(companyId, filterUser);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const canViewAll = await checkUserPermission(
        req.user!.userId,
        companyId,
        req.user!.role,
        ['Admin/ViewAllLeads', 'lead.view_all', 'Admin/Management_All']
      );

      const filterUser = canViewAll
        ? undefined
        : { userId: req.user!.userId, userName: req.user?.name };

      const lead = await LeadService.getLeadById(companyId, req.params.id, filterUser);
      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const userName = req.user?.name;
      const lead = await LeadService.createLead(companyId, req.body, userId, userName);

      await AuditService.log({
        companyId: companyId.toString(),
        userId,
        action: 'CREATE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: (lead as any)?._id?.toString() || 'N/A',
        entityName: (lead as any)?.clientName || req.body?.clientName || 'Lead',
        summary: `Created lead for "${(lead as any)?.clientName || req.body?.clientName}" (${req.body?.service || 'General'})`,
        newValue: req.body,
        req,
      });

      res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const lead = await LeadService.updateLead(companyId, req.params.id, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: req.params.id,
        entityName: (lead as any)?.clientName || '',
        summary: `Updated lead details for "${(lead as any)?.clientName || req.params.id}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Lead updated successfully', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteLead(companyId, req.params.id, req.user?.userId, req.user?.name);
      res.status(200).json({ success: true, message: 'Lead moved to Recycle Bin' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteAllLeads(companyId);
      res.status(200).json({ success: true, message: 'All leads removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllClients(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteAllClients(companyId);
      res.status(200).json({ success: true, message: 'All clients removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async removeAllData(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await LeadService.removeAllData(companyId);
      res.status(200).json({ success: true, message: 'All Lead, Client, Payment, Partner, Commission, and Payout data removed successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { date, remarks, status } = req.body;
      const createdByName = req.user?.name || 'Admin';

      const lead = await LeadService.addFollowUp(companyId, req.params.id, {
        date,
        remarks,
        status,
        createdByName,
      });

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: req.params.id,
        entityName: (lead as any)?.clientName || '',
        summary: `Follow-up logged for lead "${(lead as any)?.clientName || req.params.id}" (${status || 'Updated'})`,
        newValue: { date, remarks, status },
        req,
      });

      res.status(200).json({ success: true, message: 'Follow-up logged successfully', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async markDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { reason } = req.body;
      const lead = await LeadService.markDead(companyId, req.params.id, reason);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'STATUS_CHANGE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: req.params.id,
        entityName: (lead as any)?.clientName || '',
        summary: `Lead "${(lead as any)?.clientName || req.params.id}" marked as DEAD (${reason || 'No reason'})`,
        severity: 'WARN',
        newValue: { isDead: true, deadReason: reason },
        req,
      });

      res.status(200).json({ success: true, message: 'Lead marked as dead', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async restoreDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const lead = await LeadService.restoreDead(companyId, req.params.id);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'RESTORE',
        module: 'LEADS',
        entity: 'Lead',
        entityId: req.params.id,
        entityName: (lead as any)?.clientName || '',
        summary: `Restored dead lead "${(lead as any)?.clientName || req.params.id}" to active pipeline`,
        newValue: { isDead: false },
        req,
      });

      res.status(200).json({ success: true, message: 'Lead restored to active', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async convertToClient(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user?.userId;
      const result = await LeadService.convertToClient(companyId, req.params.id, req.body, userId);

      await AuditService.log({
        companyId: companyId.toString(),
        userId,
        action: 'STATUS_CHANGE',
        module: 'CLIENTS',
        entity: 'ClientAccount',
        entityId: (result as any)?.client?._id?.toString() || req.params.id,
        entityName: (result as any)?.client?.name || '',
        summary: `Converted Lead into official Client Account "${(result as any)?.client?.name || req.params.id}"`,
        severity: 'INFO',
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Lead converted to Client successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const canViewAll = await checkUserPermission(
        req.user!.userId,
        companyId,
        req.user!.role,
        ['Admin/ViewAllLeads', 'lead.view_all', 'Admin/Management_All']
      );

      const {
        search,
        statusMode,
        feeStatus,
        company,
        service,
        startDate,
        endDate,
        userId,
        viewingUserId,
        selectedUserId,
        userName,
      } = req.query as any;

      let targetUserId: string | undefined;
      let targetUserName: string | undefined;

      if (canViewAll) {
        targetUserId = viewingUserId || selectedUserId || userId;
        targetUserName = userName;
      } else {
        targetUserId = req.user!.userId;
        targetUserName = req.user!.name;
      }

      const clients = await LeadService.getClients(companyId, {
        search,
        statusMode,
        feeStatus,
        company,
        service,
        startDate,
        endDate,
        userId: targetUserId,
        viewingUserId: targetUserId,
        selectedUserId: targetUserId,
        userName: targetUserName,
      });
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const canViewAll = await checkUserPermission(
        req.user!.userId,
        companyId,
        req.user!.role,
        ['Admin/ViewAllLeads', 'lead.view_all', 'Admin/Management_All']
      );

      const filterUser = canViewAll
        ? undefined
        : { userId: req.user!.userId, userName: req.user?.name };

      const client = await LeadService.getClientById(companyId, req.params.id, filterUser);
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      res.status(200).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.updateClient(companyId, req.params.id, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'CLIENTS',
        entity: 'ClientAccount',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Updated Client Account "${(client as any)?.name || req.params.id}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async addClientFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.addClientFollowUp(companyId, req.params.id, {
        ...req.body,
        createdByName: req.user?.name || 'Admin',
      });

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'CLIENTS',
        entity: 'ClientAccount',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Added follow-up for client "${(client as any)?.name || req.params.id}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Follow-up added successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async markClientDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { reason } = req.body;
      const client = await LeadService.markClientDead(companyId, req.params.id, reason);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'STATUS_CHANGE',
        module: 'CLIENTS',
        entity: 'ClientAccount',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Marked client "${(client as any)?.name || req.params.id}" as DEAD (${reason || 'No reason'})`,
        severity: 'WARN',
        newValue: { isDead: true, deadReason: reason },
        req,
      });

      res.status(200).json({ success: true, message: 'Client marked as dead', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async restoreClientDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.restoreClientDead(companyId, req.params.id);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'RESTORE',
        module: 'CLIENTS',
        entity: 'ClientAccount',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Restored dead client "${(client as any)?.name || req.params.id}" to active clients`,
        newValue: { isDead: false },
        req,
      });

      res.status(200).json({ success: true, message: 'Client restored successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteClient(companyId, req.params.id, req.user?.userId, req.user?.name);
      res.status(200).json({ success: true, message: 'Client moved to Recycle Bin' });
    } catch (error) {
      next(error);
    }
  }

  static async reseedClients(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const clients = await LeadService.seedRealisticClients(companyId);
      res.status(200).json({ success: true, message: '12 realistic clients seeded successfully', data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async saveLedgerSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { estimator, stages } = req.body;
      const client = await LeadService.saveLedgerSchedule(companyId, req.params.id, estimator, stages);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'PAYMENTS',
        entity: 'LedgerSchedule',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Saved payment ledger schedule for client "${(client as any)?.name || req.params.id}" (${stages?.length || 0} stages)`,
        newValue: { estimator, stagesCount: stages?.length },
        req,
      });

      res.status(200).json({ success: true, message: 'Ledger schedule saved successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async payLedgerStage(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { stageId, amount, paymentMode, referenceNo } = req.body;
      const client = await LeadService.payLedgerStage(
        companyId,
        req.params.id,
        stageId,
        amount,
        paymentMode || 'UPI',
        referenceNo
      );

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'PAYMENTS',
        entity: 'Payment',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Recorded stage payment of ₹${amount} (${paymentMode || 'UPI'}) for "${(client as any)?.name || req.params.id}"`,
        severity: 'INFO',
        newValue: { stageId, amount, paymentMode, referenceNo },
        req,
      });

      res.status(200).json({ success: true, message: 'Stage payment recorded successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async submitDpr(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.submitDailyProgressReport(companyId, req.params.id, {
        ...req.body,
        reportedBy: req.user?.name || 'Admin',
      });

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'REPORTS',
        entity: 'DailyProgressReport',
        entityId: req.params.id,
        entityName: (client as any)?.name || '',
        summary: `Submitted Daily Progress Report for client "${(client as any)?.name || req.params.id}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Daily Progress Report submitted', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { search, startDate, endDate, limit } = req.query;
      const payments = await LeadService.getPayments(companyId, {
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const payment = await LeadService.recordPayment(companyId, {
        ...req.body,
        receivedBy: req.user?.name || 'Admin',
      });

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'PAYMENTS',
        entity: 'Payment',
        entityId: (payment as any)?._id?.toString() || 'N/A',
        entityName: req.body?.clientName || '',
        summary: `Collected payment of ₹${req.body?.amount} (${req.body?.paymentMode || 'Cash'}) for "${req.body?.clientName || 'Client'}"`,
        severity: 'INFO',
        newValue: req.body,
        req,
      });

      res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async getPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const partners = await LeadService.getPartners(companyId);
      res.status(200).json({ success: true, data: partners });
    } catch (error) {
      next(error);
    }
  }

  static async createPartner(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const partner = await LeadService.createPartner(companyId, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'PARTNERS',
        entity: 'Partner',
        entityId: (partner as any)?._id?.toString() || 'N/A',
        entityName: partner?.name || req.body?.name || '',
        summary: `Registered new reference partner "${partner?.name || req.body?.name}"`,
        newValue: req.body,
        req,
      });

      res.status(201).json({ success: true, message: 'Partner created successfully', data: partner });
    } catch (error) {
      next(error);
    }
  }

  static async updatePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const partner = await LeadService.updatePartner(companyId, req.params.id, req.body);

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'PARTNERS',
        entity: 'Partner',
        entityId: req.params.id,
        entityName: partner?.name || req.body?.name || '',
        summary: `Updated reference partner "${partner?.name || req.body?.name || req.params.id}"`,
        newValue: req.body,
        req,
      });

      res.status(200).json({ success: true, message: 'Partner updated successfully', data: partner });
    } catch (error) {
      next(error);
    }
  }

  static async deletePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deletePartner(companyId, req.params.id, req.user?.userId, req.user?.name);
      res.status(200).json({ success: true, message: 'Partner moved to Recycle Bin' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteAllPartners(companyId);
      res.status(200).json({ success: true, message: 'All partners removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getCommissionReports(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const partnerId = req.query.partnerId as string;
      const result = await LeadService.getCommissionReports(companyId, partnerId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async approveCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const commissionId = req.params.id;
      const commission = await LeadService.approveCommission(companyId, commissionId, req.user?.name || 'Admin');

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'UPDATE',
        module: 'PARTNERS',
        entity: 'Commission',
        entityId: commissionId,
        summary: `Approved commission of ₹${(commission as any)?.commissionAmount || ''} for partner "${(commission as any)?.partnerName || ''}"`,
        severity: 'WARN',
        req,
      });

      res.status(200).json({ success: true, message: 'Commission approved successfully', data: commission });
    } catch (error) {
      next(error);
    }
  }

  static async processPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await LeadService.processPayout(companyId, {
        ...req.body,
        paidBy: req.user?.name || 'Admin',
      });

      await AuditService.log({
        companyId: companyId.toString(),
        userId: req.user?.userId,
        action: 'CREATE',
        module: 'PARTNERS',
        entity: 'Payout',
        entityId: (result as any)?._id?.toString() || 'N/A',
        summary: `Processed partner payout of ₹${req.body?.payoutAmount} (${req.body?.paymentMode || 'Bank'})`,
        severity: 'WARN',
        newValue: req.body,
        req,
      });

      res.status(201).json({ success: true, message: 'Payout to partner disbursed successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { partnerId, search } = req.query as any;
      const payouts = await LeadService.getPayouts(companyId, { partnerId, search });
      res.status(200).json({ success: true, data: payouts });
    } catch (error) {
      next(error);
    }
  }

  static async getClientDossier(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const dossier = await LeadService.getClientDossier(companyId, req.params.id);
      res.status(200).json({ success: true, data: dossier });
    } catch (error) {
      next(error);
    }
  }

  static async reseedRealLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.ensureInitialSeedData(companyId);
      res.status(200).json({ success: true, message: 'Real data initialized successfully' });
    } catch (error) {
      next(error);
    }
  }
}
