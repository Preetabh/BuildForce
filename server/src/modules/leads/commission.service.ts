import mongoose from 'mongoose';
import { CommissionRecord, ICommissionRecord } from '../../models/CommissionRecord';
import { PartnerPayout, IPartnerPayout } from '../../models/PartnerPayout';
import { Partner } from '../../models/Partner';
import { ClientAccount } from '../../models/ClientAccount';
import { PaymentRecord } from '../../models/PaymentRecord';
import { Lead } from '../../models/Lead';

export class CommissionService {
  /**
   * Centralized Commission calculation formula
   */
  static calculateCommission(paymentAmount: number, ratePercent: number): number {
    if (!paymentAmount || paymentAmount <= 0 || !ratePercent || ratePercent <= 0) {
      return 0;
    }
    return Math.round(((paymentAmount * ratePercent) / 100) * 100) / 100;
  }

  /**
   * Generate commission on receipt of payment from client
   * Idempotent: Prevents duplicate commission for the same payment
   */
  static async generateCommissionForPayment(params: {
    companyId: string | mongoose.Types.ObjectId;
    paymentId: string | mongoose.Types.ObjectId;
    clientId?: string | mongoose.Types.ObjectId;
    paymentAmount: number;
    receivedBy?: string;
  }): Promise<ICommissionRecord | null> {
    const compId = new mongoose.Types.ObjectId(params.companyId);
    const payId = new mongoose.Types.ObjectId(params.paymentId);

    // 1. Prevent duplicate: Check if commission already generated for this payment
    const existingComm = await CommissionRecord.findOne({
      companyId: compId,
      paymentId: payId,
    });
    if (existingComm) {
      return existingComm;
    }

    // 2. Identify the client
    let client = null;
    if (params.clientId) {
      client = await ClientAccount.findOne({ _id: params.clientId, companyId: compId });
    } else {
      const payment = await PaymentRecord.findById(payId);
      if (payment?.clientId) {
        client = await ClientAccount.findOne({ _id: payment.clientId, companyId: compId });
      }
    }

    if (!client) {
      return null;
    }

    // 3. Find partner linked to this client
    let partner = null;
    if (client.partnerId) {
      partner = await Partner.findOne({ _id: client.partnerId, companyId: compId });
    }

    // Fallback: If partnerId was not set, try partnerName or associate string
    if (!partner && (client.partnerName || client.associate)) {
      const searchName = client.partnerName || client.associate?.replace(/^(Associate|Channel Partner|Social Media|Broker):\s*/i, '').trim();
      if (searchName) {
        partner = await Partner.findOne({
          companyId: compId,
          name: new RegExp(`^${searchName}$`, 'i'),
        });
        if (partner) {
          // Link permanently
          client.partnerId = partner._id as any;
          client.partnerName = partner.name;
          await client.save();
        }
      }
    }

    // If still no partner, check originating lead
    if (!partner && client.leadId) {
      const lead = await Lead.findById(client.leadId);
      if (lead?.referenceDetails?.partnerId) {
        partner = await Partner.findOne({ _id: lead.referenceDetails.partnerId, companyId: compId });
      } else if (lead?.referenceDetails?.partnerName) {
        partner = await Partner.findOne({
          companyId: compId,
          name: new RegExp(`^${lead.referenceDetails.partnerName}$`, 'i'),
        });
      }
      if (partner) {
        client.partnerId = partner._id as any;
        client.partnerName = partner.name;
        await client.save();
      }
    }

    if (!partner) {
      return null; // No partner referred this client
    }

    // 4. Calculate commission
    const commissionPercent = partner.commissionRatePercent || 2.5;
    const commissionAmount = this.calculateCommission(params.paymentAmount, commissionPercent);

    if (commissionAmount <= 0) {
      return null;
    }

    // 5. Create Commission Record linked to exact payment
    const commission = new CommissionRecord({
      companyId: compId,
      partnerId: partner._id,
      partnerName: partner.name,
      clientId: client._id,
      clientName: client.name,
      leadId: client.leadId,
      leadCode: client.clientCode?.replace(/^CL-/, '') || '',
      paymentId: payId,
      paymentAmount: params.paymentAmount,
      projectValue: client.agreedAmount || params.paymentAmount,
      commissionPercent,
      commissionAmount,
      paidAmount: 0,
      balanceAmount: commissionAmount,
      status: 'Pending',
      notes: `Auto-generated from client payment ₹${params.paymentAmount.toLocaleString()} (${commissionPercent}%)`,
    });

    await commission.save();

    // 6. Link to PaymentRecord
    await PaymentRecord.updateOne(
      { _id: payId },
      { $set: { commissionGenerated: true, commissionId: commission._id } }
    );

    // 7. Update Partner stats
    partner.totalCommissionEarned = (partner.totalCommissionEarned || 0) + commissionAmount;
    await partner.save();

    return commission;
  }

  /**
   * Approve a commission (Admin approval workflow)
   */
  static async approveCommission(companyId: string, commissionId: string, approvedBy: string = 'Admin') {
    const commission = await CommissionRecord.findOne({
      _id: new mongoose.Types.ObjectId(commissionId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!commission) {
      throw new Error('Commission record not found');
    }

    if (commission.status === 'Paid') {
      return commission;
    }

    commission.status = 'Approved';
    commission.approvedBy = approvedBy;
    commission.approvedAt = new Date();
    await commission.save();

    return commission;
  }

  /**
   * Pay Amount: Disburse payout to Reference Partner linked to commission
   * Prevents overpayment and duplicate payouts
   */
  static async processPayout(
    companyId: string,
    payoutData: {
      partnerId: string;
      commissionId?: string;
      amount: number;
      paymentMode?: string;
      transactionRef?: string;
      notes?: string;
      paidBy?: string;
    }
  ) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const partnerId = new mongoose.Types.ObjectId(payoutData.partnerId);

    const partner = await Partner.findOne({ _id: partnerId, companyId: compId });
    if (!partner) {
      throw new Error('Reference Partner not found');
    }

    if (!payoutData.amount || payoutData.amount <= 0) {
      throw new Error('Payout amount must be greater than zero');
    }

    let commission: ICommissionRecord | null = null;
    let targetClientId: mongoose.Types.ObjectId | undefined;
    let targetClientName = '';

    // Specific commission payout
    if (payoutData.commissionId) {
      commission = await CommissionRecord.findOne({
        _id: new mongoose.Types.ObjectId(payoutData.commissionId),
        companyId: compId,
        partnerId,
      });

      if (!commission) {
        throw new Error('Commission record not found for this partner');
      }

      const pendingBal = commission.balanceAmount ?? (commission.commissionAmount - (commission.paidAmount || 0));
      if (payoutData.amount > pendingBal) {
        throw new Error(
          `Overpayment prevented: Requested amount ₹${payoutData.amount.toLocaleString()} exceeds unpaid commission balance of ₹${pendingBal.toLocaleString()}`
        );
      }

      commission.paidAmount = (commission.paidAmount || 0) + payoutData.amount;
      commission.balanceAmount = Math.max(0, commission.commissionAmount - commission.paidAmount);

      if (commission.balanceAmount <= 0) {
        commission.status = 'Paid';
        commission.paidAt = new Date();
        commission.paidBy = payoutData.paidBy || 'Admin';
      } else if (commission.status === 'Pending') {
        commission.status = 'Approved';
      }

      commission.paymentDate = new Date();
      commission.paymentRef = payoutData.transactionRef || '';
      await commission.save();

      targetClientId = commission.clientId;
      targetClientName = commission.clientName;
    } else {
      // Automatic allocation across oldest pending/approved commissions
      const pendingComms = await CommissionRecord.find({
        companyId: compId,
        partnerId,
        status: { $in: ['Pending', 'Approved'] },
      }).sort({ createdAt: 1 });

      let remainingToPay = payoutData.amount;
      for (const comm of pendingComms) {
        if (remainingToPay <= 0) break;
        const commBal = comm.balanceAmount ?? (comm.commissionAmount - (comm.paidAmount || 0));
        const payPortion = Math.min(commBal, remainingToPay);

        comm.paidAmount = (comm.paidAmount || 0) + payPortion;
        comm.balanceAmount = Math.max(0, comm.commissionAmount - comm.paidAmount);
        if (comm.balanceAmount <= 0) {
          comm.status = 'Paid';
          comm.paidAt = new Date();
          comm.paidBy = payoutData.paidBy || 'Admin';
        } else {
          comm.status = 'Approved';
        }
        await comm.save();

        remainingToPay -= payPortion;
        if (!targetClientId) {
          targetClientId = comm.clientId;
          targetClientName = comm.clientName;
        }
      }
    }

    // Create PartnerPayout record
    const payoutNo = `PAY-${Date.now().toString().slice(-6)}`;
    const payout = new PartnerPayout({
      companyId: compId,
      payoutNo,
      partnerId,
      partnerName: partner.name,
      commissionId: commission?._id,
      clientId: targetClientId,
      clientName: targetClientName,
      amount: payoutData.amount,
      paymentDate: new Date(),
      paymentMode: payoutData.paymentMode || 'UPI',
      transactionRef: payoutData.transactionRef?.trim() || '',
      notes: payoutData.notes?.trim() || '',
      status: 'Paid',
      paidBy: payoutData.paidBy || 'Admin',
    });

    await payout.save();

    // Link payoutId back to Commission if specific
    if (commission) {
      commission.payoutId = payout._id as any;
      await commission.save();
    }

    // Update Partner cumulative paid
    partner.totalCommissionPaid = (partner.totalCommissionPaid || 0) + payoutData.amount;
    await partner.save();

    return { payout, commission };
  }

  /**
   * Get all payouts made to reference partners
   */
  static async getPayouts(
    companyId: string,
    filter?: { partnerId?: string; search?: string }
  ) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const query: any = { companyId: compId };

    if (filter?.partnerId) {
      query.partnerId = new mongoose.Types.ObjectId(filter.partnerId);
    }

    if (filter?.search && filter.search.trim()) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { partnerName: regex },
        { payoutNo: regex },
        { transactionRef: regex },
        { clientName: regex },
        { notes: regex },
      ];
    }

    const payouts = await PartnerPayout.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean();
    return payouts;
  }

  /**
   * Unified Commission Report reading directly from Commission + Client + Partner + Payment + Payout
   */
  static async getCommissionReports(companyId: string, partnerId?: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const query: any = { companyId: compId };

    if (partnerId && mongoose.Types.ObjectId.isValid(partnerId)) {
      query.partnerId = new mongoose.Types.ObjectId(partnerId);
    }

    const reports = await CommissionRecord.find(query)
      .populate('partnerId', 'name phone partnerType commissionRatePercent')
      .populate('clientId', 'clientCode name agreedAmount paidAmount balanceAmount siteLocation')
      .populate('paymentId', 'receiptNo amount paymentDate paymentMode transactionRef')
      .populate('payoutId', 'payoutNo paymentDate paymentMode transactionRef')
      .sort({ createdAt: -1 })
      .lean();

    const summary = reports.reduce(
      (acc, curr) => {
        acc.totalCommission += curr.commissionAmount || 0;
        acc.paidCommission += curr.paidAmount || (curr.status === 'Paid' ? curr.commissionAmount : 0);
        acc.pendingCommission +=
          curr.balanceAmount !== undefined
            ? curr.balanceAmount
            : curr.status === 'Paid'
            ? 0
            : curr.commissionAmount;
        return acc;
      },
      { totalCommission: 0, paidCommission: 0, pendingCommission: 0 }
    );

    return { reports, summary };
  }

  /**
   * Complete connected dossier for a client:
   * Client → Lead → Payments → Reference Partner → Commission → Payouts
   */
  static async getClientDossier(companyId: string, clientId: string) {
    const compId = new mongoose.Types.ObjectId(companyId);
    const cId = new mongoose.Types.ObjectId(clientId);

    const client = await ClientAccount.findOne({ _id: cId, companyId: compId }).lean();
    if (!client) {
      throw new Error('Client not found');
    }

    // 1. Linked Lead
    let lead = null;
    if (client.leadId) {
      lead = await Lead.findById(client.leadId).lean();
    }

    // 2. Incoming Payments received from client
    const payments = await PaymentRecord.find({
      companyId: compId,
      clientId: cId,
    })
      .sort({ paymentDate: -1 })
      .lean();

    // 3. Linked Reference Partner
    let partner = null;
    if (client.partnerId) {
      partner = await Partner.findById(client.partnerId).lean();
    }

    // 4. Commission records generated from this client's payments
    const commissions = await CommissionRecord.find({
      companyId: compId,
      clientId: cId,
    })
      .populate('paymentId', 'receiptNo amount paymentDate paymentMode transactionRef')
      .sort({ createdAt: -1 })
      .lean();

    // 5. Partner Payouts disbursed against this client's commissions
    const payouts = await PartnerPayout.find({
      companyId: compId,
      clientId: cId,
    })
      .sort({ paymentDate: -1 })
      .lean();

    return {
      client,
      lead,
      payments,
      partner,
      commissions,
      payouts,
    };
  }
}
