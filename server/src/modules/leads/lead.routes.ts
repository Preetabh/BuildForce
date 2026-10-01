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

// Payments & Pay Amount
router.get('/payments/all', LeadController.getPayments);
router.post('/payments/pay', LeadController.recordPayment);

// Reference Partners
router.get('/partners/all', LeadController.getPartners);
router.post('/partners/create', LeadController.createPartner);
router.delete('/partners/all', LeadController.deleteAllPartners);
router.delete('/partners/:id', LeadController.deletePartner);

// Commission Reports
router.get('/commissions/report', LeadController.getCommissionReports);

export default router;
