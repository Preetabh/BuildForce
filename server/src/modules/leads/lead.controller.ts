import { Request, Response, NextFunction } from 'express';
import { LeadService } from './lead.service';

export class LeadController {
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { search, statusMode, companyCode, service, startDate, endDate, stage, priority, view, page, limit } =
        req.query;

      const result = await LeadService.getLeads(companyId, {
        search: search as string,
        statusMode: statusMode as any,
        companyCode: companyCode as string,
        service: service as string,
        startDate: startDate as string,
        endDate: endDate as string,
        stage: stage as string,
        priority: priority as string,
        view: view as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadStats(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const stats = await LeadService.getLeadStats(companyId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const lead = await LeadService.getLeadById(companyId, req.params.id);
      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const lead = await LeadService.createLead(companyId, req.body, userId);
      res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const lead = await LeadService.updateLead(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Lead updated successfully', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteLead(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Lead deleted successfully' });
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
      res.status(200).json({ success: true, message: 'Lead marked as dead', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async restoreDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const lead = await LeadService.restoreDead(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Lead restored to active', data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async convertToClient(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const result = await LeadService.convertToClient(companyId, req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Lead converted to Client successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { search, statusMode, feeStatus, company, service, startDate, endDate } = req.query as any;
      const clients = await LeadService.getClients(companyId, {
        search,
        statusMode,
        feeStatus,
        company,
        service,
        startDate,
        endDate,
      });
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.getClientById(companyId, req.params.id);
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
      res.status(200).json({ success: true, message: 'Client marked as dead', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async restoreClientDead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const client = await LeadService.restoreClientDead(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Client restored successfully', data: client });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deleteClient(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async reseedClients(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const clients = await LeadService.seedRealisticClients(companyId);
      res.status(200).json({ success: true, message: '13 realistic clients seeded successfully', data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async saveLedgerSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const { estimator, stages } = req.body;
      const client = await LeadService.saveLedgerSchedule(companyId, req.params.id, estimator, stages);
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
      res.status(201).json({ success: true, message: 'Partner created successfully', data: partner });
    } catch (error) {
      next(error);
    }
  }

  static async deletePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      await LeadService.deletePartner(companyId, req.params.id);
      res.status(200).json({ success: true, message: 'Partner deleted successfully' });
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
