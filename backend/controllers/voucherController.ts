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
      title,
      date,
      partyId,
      narration,
      items,
      bankAccountId, // For payment/receipt
      expenseAccountId, // For direct payment
      incomeAccountId, // For direct receipt
    } = req.body;
    const userId = (req as any).user.userId;

    // Generate voucher number
    const count = await prisma.voucher.count({ where: { type, userId } });
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

    // Get account IDs for ledger entries (scoped to user or global)
    const salesAccount = await prisma.account.findFirst({
      where: {
        name: 'Sales Account',
        OR: [{ userId }, { userId: null }]
      }
    });
    const purchaseAccount = await prisma.account.findFirst({
      where: {
        name: 'Purchase Account',
        OR: [{ userId }, { userId: null }]
      }
    });
    const outputGstAccount = await prisma.account.findFirst({
      where: {
        name: 'Output GST',
        OR: [{ userId }, { userId: null }]
      }
    });
    const inputGstAccount = await prisma.account.findFirst({
      where: {
        name: 'Input GST',
        OR: [{ userId }, { userId: null }]
      }
    });

    // Generate ledger entries based on voucher type
    let ledgerEntries: any[] = [];

    switch (type) {
      case 'SALES':
        if (!salesAccount || !outputGstAccount) {
          return res.status(400).json({ error: 'Sales or Output GST account not found' });
        }
        ledgerEntries = AccountingEngine.createSalesEntries(
          partyId,
          totalAmount,
          baseAmount,
          gstAmount,
          salesAccount.id,
          outputGstAccount.id
        );
        break;

      case 'PURCHASE':
        if (!purchaseAccount || !inputGstAccount) {
          return res.status(400).json({ error: 'Purchase or Input GST account not found' });
        }
        ledgerEntries = AccountingEngine.createPurchaseEntries(
          partyId,
          totalAmount,
          baseAmount,
          gstAmount,
          purchaseAccount.id,
          inputGstAccount.id
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
          userId,
          voucherNumber,
          title,
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
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.amount),
            gstRate: parseFloat(item.gstRate),
            gstAmount: parseFloat(item.gstAmount),
            total: parseFloat(item.total),
          })),
        });
      }

      // Create ledger entries
      await tx.ledgerEntry.createMany({
        data: ledgerEntries.map((entry: any) => ({
          userId,
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
    res.status(500).json({ error: 'Failed to create voucher', details: (error as any).message });
  }
};

// GET ALL VOUCHERS
export const getVouchers = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const userId = (req as any).user.userId;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (search) {
      where.OR = [
        { voucherNumber: { contains: search as string } },
        { title: { contains: search as string } },
        { party: { name: { contains: search as string } } },
      ];
    }

    const [vouchers, total] = await prisma.$transaction([
      prisma.voucher.findMany({
        where,
        include: {
          party: true,
          items: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take,
      }),
      prisma.voucher.count({ where }),
    ]);

    res.json({
      data: vouchers,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
};

// GET SINGLE VOUCHER
export const getVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const voucher = await prisma.voucher.findFirst({
      where: { id, userId },
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
    const userId = (req as any).user.userId;

    // Verify ownership before deleting
    const existingVoucher = await prisma.voucher.findFirst({
      where: { id, userId },
    });

    if (!existingVoucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

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

// UPDATE VOUCHER
export const updateVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      date,
      partyId,
      narration,
      items,
      bankAccountId,
      expenseAccountId,
      incomeAccountId,
    } = req.body;
    const userId = (req as any).user.userId;

    // 1. Verify existence and ownership
    const existingVoucher = await prisma.voucher.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existingVoucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const type = existingVoucher.type; // Keep original type

    // 2. Calculate new totals
    let totalAmount = 0;
    let baseAmount = 0;
    let gstAmount = 0;

    if (items && items.length > 0) {
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
      totalAmount = req.body.amount || 0;
    }

    // 3. Get accounts (scoped to user or global)
    const salesAccount = await prisma.account.findFirst({
      where: { name: 'Sales Account', OR: [{ userId }, { userId: null }] }
    });
    const purchaseAccount = await prisma.account.findFirst({
      where: { name: 'Purchase Account', OR: [{ userId }, { userId: null }] }
    });
    const outputGstAccount = await prisma.account.findFirst({
      where: { name: 'Output GST', OR: [{ userId }, { userId: null }] }
    });
    const inputGstAccount = await prisma.account.findFirst({
      where: { name: 'Input GST', OR: [{ userId }, { userId: null }] }
    });

    // 4. Generate new ledger entries
    let ledgerEntries: any[] = [];

    switch (type) {
      case 'SALES':
        if (!salesAccount || !outputGstAccount) return res.status(400).json({ error: 'Sales/GST accounts missing' });
        ledgerEntries = AccountingEngine.createSalesEntries(partyId, totalAmount, baseAmount, gstAmount, salesAccount.id, outputGstAccount.id);
        break;
      case 'PURCHASE':
        if (!purchaseAccount || !inputGstAccount) return res.status(400).json({ error: 'Purchase/GST accounts missing' });
        ledgerEntries = AccountingEngine.createPurchaseEntries(partyId, totalAmount, baseAmount, gstAmount, purchaseAccount.id, inputGstAccount.id);
        break;
      case 'PAYMENT':
        ledgerEntries = AccountingEngine.createPaymentEntries(bankAccountId, totalAmount, partyId, expenseAccountId);
        break;
      case 'RECEIPT':
        ledgerEntries = AccountingEngine.createReceiptEntries(bankAccountId, totalAmount, partyId, incomeAccountId);
        break;
    }

    // 5. Validate entries
    if (!AccountingEngine.validateEntries(ledgerEntries)) {
      return res.status(400).json({ error: 'Ledger entries do not balance' });
    }

    // 6. Transaction: Delete old, Update voucher, Create new
    const updatedVoucher = await prisma.$transaction(async (tx: any) => {
      await tx.voucherItem.deleteMany({ where: { voucherId: id } });
      await tx.ledgerEntry.deleteMany({ where: { voucherId: id } });

      const voucher = await tx.voucher.update({
        where: { id },
        data: {
          title,
          date: new Date(date),
          partyId,
          narration,
          totalAmount,
        },
      });

      if (items && items.length > 0) {
        await tx.voucherItem.createMany({
          data: items.map((item: any) => ({
            voucherId: voucher.id,
            description: item.description,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.amount),
            gstRate: parseFloat(item.gstRate),
            gstAmount: parseFloat(item.gstAmount),
            total: parseFloat(item.total),
          })),
        });
      }

      await tx.ledgerEntry.createMany({
        data: ledgerEntries.map((entry: any) => ({
          userId,
          voucherId: voucher.id,
          accountId: entry.accountId,
          date: new Date(date),
          debit: entry.debit,
          credit: entry.credit,
        })),
      });

      return voucher;
    });

    res.json(updatedVoucher);
  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({ error: 'Failed to update voucher' });
  }
};