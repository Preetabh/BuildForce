import { Router } from 'express';
import { LeadController } from './lead.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Leads List & Stats
router.get('/', LeadController.getLeads);
router.get('/stats', LeadController.getLeadStats);
router.post('/', LeadController.createLead);
router.post('/seed', LeadController.reseedRealLeads);
router.delete('/all', LeadController.deleteAllLeads);
router.delete('/clear-all', LeadController.removeAllData);
router.post('/clear-all', LeadController.removeAllData);

// Individual Lead Actions
router.get('/:id', LeadController.getLeadById);
router.put('/:id', LeadController.updateLead);
router.patch('/:id', LeadController.updateLead);
router.delete('/:id', LeadController.deleteLead);
router.post('/:id/follow-up', LeadController.addFollowUp);
router.post('/:id/mark-dead', LeadController.markDead);
router.post('/:id/restore', LeadController.restoreDead);
router.post('/:id/convert-client', LeadController.convertToClient);

// Clients
router.get('/clients/all', LeadController.getClients);
router.post('/clients/seed', LeadController.reseedClients);
router.get('/clients/:id', LeadController.getClientById);
router.put('/clients/:id', LeadController.updateClient);
router.patch('/clients/:id', LeadController.updateClient);
router.post('/clients/:id/follow-up', LeadController.addClientFollowUp);
router.post('/clients/:id/mark-dead', LeadController.markClientDead);
router.post('/clients/:id/restore', LeadController.restoreClientDead);
router.post('/clients/:id/ledger', LeadController.saveLedgerSchedule);
router.post('/clients/:id/pay-stage', LeadController.payLedgerStage);
router.post('/clients/:id/dpr', LeadController.submitDpr);
router.get('/clients/:id/dossier', LeadController.getClientDossier);
router.delete('/clients/all', LeadController.deleteAllClients);
router.delete('/clients/:id', LeadController.deleteClient);

// Payments (money received FROM client)
router.get('/payments/all', LeadController.getPayments);
router.post('/payments/pay', LeadController.recordPayment);

// Payouts (Pay Amount - money paid TO reference partner against commission)
router.get('/payouts/all', LeadController.getPayouts);
router.post('/payouts/pay', LeadController.processPayout);

// Reference Partners
router.get('/partners/all', LeadController.getPartners);
router.post('/partners/create', LeadController.createPartner);
router.put('/partners/:id', LeadController.updatePartner);
router.delete('/partners/all', LeadController.deleteAllPartners);
router.delete('/partners/:id', LeadController.deletePartner);

// Commissions & Reports
router.get('/commissions/report', LeadController.getCommissionReports);
router.post('/commissions/:id/approve', LeadController.approveCommission);

export default router;
