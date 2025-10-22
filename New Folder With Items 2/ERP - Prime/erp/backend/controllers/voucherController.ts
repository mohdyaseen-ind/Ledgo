import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AccountingEngine } from '../lib/accounting';

// Helper to generate voucher numbers
function generateVoucherNumber(type: string, count: number): string {
  const prefix = {
    SALES: 'SV',
    PURCHASE: 'PV',
    PAYMENT: 'PY',
    RECEIPT: 'RC',
  }[type] || 'VO';
  
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// CREATE VOUCHER
export const createVoucher = async (req: Request, res: Response) => {
  try {
    const {
      type,
      date,
      partyId,
      narration,
      items,
      bankAccountId, // For payment/receipt
      expenseAccountId, // For direct payment
      incomeAccountId, // For direct receipt
    } = req.body;

    // Generate voucher number
    const count = await prisma.voucher.count({ where: { type } });
    const voucherNumber = generateVoucherNumber(type, count);

    // Calculate total amount from items
    let totalAmount = 0;
    let baseAmount = 0;
    let gstAmount = 0;

    if (items && items.length > 0) {
      // Multi-line items (for Sales/Purchase)
      items.forEach((item: any) => {
        const itemAmount = item.quantity * item.rate;
        const itemGst = (itemAmount * item.gstRate) / 100;
        item.amount = itemAmount;
        item.gstAmount = itemGst;
        item.total = itemAmount + itemGst;
        
        baseAmount += itemAmount;
        gstAmount += itemGst;
        totalAmount += item.total;
      });
    } else {
      // Single amount (for Payment/Receipt)
      totalAmount = req.body.amount || 0;
    }

    // Get account IDs for ledger entries
    const salesAccount = await prisma.account.findFirst({ 
      where: { name: 'Sales Account' } 
    });
    const purchaseAccount = await prisma.account.findFirst({ 
      where: { name: 'Purchase Account' } 
    });
    const outputGstAccount = await prisma.account.findFirst({ 
      where: { name: 'Output GST' } 
    });
    const inputGstAccount = await prisma.account.findFirst({ 
      where: { name: 'Input GST' } 
    });

    // Generate ledger entries based on voucher type
    let ledgerEntries: any[] = [];

    switch (type) {
      case 'SALES':
        ledgerEntries = AccountingEngine.createSalesEntries(
          partyId,
          totalAmount,
          baseAmount,
          gstAmount,
          salesAccount!.id,
          outputGstAccount!.id
        );
        break;

      case 'PURCHASE':
        ledgerEntries = AccountingEngine.createPurchaseEntries(
          partyId,
          totalAmount,
          baseAmount,
          gstAmount,
          purchaseAccount!.id,
          inputGstAccount!.id
        );
        break;

      case 'PAYMENT':
        ledgerEntries = AccountingEngine.createPaymentEntries(
          bankAccountId,
          totalAmount,
          partyId,
          expenseAccountId
        );
        break;

      case 'RECEIPT':
        ledgerEntries = AccountingEngine.createReceiptEntries(
          bankAccountId,
          totalAmount,
          partyId,
          incomeAccountId
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid voucher type' });
    }

    // Validate double-entry
    if (!AccountingEngine.validateEntries(ledgerEntries)) {
      return res.status(400).json({ error: 'Ledger entries do not balance' });
    }

    // Create voucher with items and ledger entries in a transaction
    const voucher = await prisma.$transaction(async (tx: any) => {
      // Create voucher
      const newVoucher = await tx.voucher.create({
        data: {
          voucherNumber,
          type,
          date: new Date(date),
          partyId,
          narration,
          totalAmount,
        },
      });

      // Create items (if any)
      if (items && items.length > 0) {
        await tx.voucherItem.createMany({
          data: items.map((item: any) => ({
            voucherId: newVoucher.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            total: item.total,
          })),
        });
      }

      // Create ledger entries
      await tx.ledgerEntry.createMany({
        data: ledgerEntries.map((entry) => ({
          voucherId: newVoucher.id,
          accountId: entry.accountId,
          date: new Date(date),
          debit: entry.debit,
          credit: entry.credit,
        })),
      });

      return newVoucher;
    });

    res.status(201).json(voucher);
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
};

// GET ALL VOUCHERS
export const getVouchers = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query;

    const where: any = {
      isDeleted: false,
    };

    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        party: true,
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
};

// GET SINGLE VOUCHER
export const getVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        party: true,
        items: true,
        ledgerEntries: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    res.json(voucher);
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({ error: 'Failed to fetch voucher' });
  }
};

// DELETE VOUCHER (soft delete)
export const deleteVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Voucher deleted successfully', voucher });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({ error: 'Failed to delete voucher' });
  }
};