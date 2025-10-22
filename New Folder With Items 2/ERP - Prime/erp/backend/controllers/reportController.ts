// backend/controllers/reportController.ts

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// TRIAL BALANCE
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const endDate = date ? new Date(date as string) : new Date();

    // Get all ledger entries up to date
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        date: { lte: endDate },
        voucher: { isDeleted: false },
      },
      include: { account: true },
    });

    // Group by account
    const balances = new Map<string, any>();

    entries.forEach((entry) => {
      const existing = balances.get(entry.accountId) || {
        accountId: entry.accountId,
        accountName: entry.account.name,
        accountType: entry.account.type,
        debit: 0,
        credit: 0,
      };

      existing.debit += entry.debit;
      existing.credit += entry.credit;
      balances.set(entry.accountId, existing);
    });

    // Add opening balances
    const accounts = await prisma.account.findMany();
    accounts.forEach((account) => {
      if (account.openingBalance !== 0) {
        const existing = balances.get(account.id) || {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          debit: 0,
          credit: 0,
        };

        // Opening balance rules:
        // Asset/Expense = Debit side
        // Liability/Income = Credit side
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          existing.debit += account.openingBalance;
        } else {
          existing.credit += account.openingBalance;
        }

        balances.set(account.id, existing);
      }
    });

    const trialBalance = Array.from(balances.values());
    
    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    res.json({
      trialBalance,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ error: 'Failed to generate trial balance' });
  }
};

// PROFIT & LOSS
export const getProfitAndLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        date: { gte: start, lte: end },
        voucher: { isDeleted: false },
      },
      include: { account: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeAccounts: any[] = [];
    const expenseAccounts: any[] = [];

    // Group by account
    const accountTotals = new Map<string, any>();

    entries.forEach((entry) => {
      const existing = accountTotals.get(entry.accountId) || {
        accountId: entry.accountId,
        accountName: entry.account.name,
        accountType: entry.account.type,
        amount: 0,
      };

      if (entry.account.type === 'INCOME') {
        existing.amount += entry.credit - entry.debit;
      } else if (entry.account.type === 'EXPENSE') {
        existing.amount += entry.debit - entry.credit;
      }

      accountTotals.set(entry.accountId, existing);
    });

    accountTotals.forEach((account) => {
      if (account.accountType === 'INCOME' && account.amount > 0) {
        incomeAccounts.push(account);
        totalIncome += account.amount;
      } else if (account.accountType === 'EXPENSE' && account.amount > 0) {
        expenseAccounts.push(account);
        totalExpenses += account.amount;
      }
    });

    const netProfit = totalIncome - totalExpenses;

    res.json({
      incomeAccounts,
      expenseAccounts,
      totalIncome,
      totalExpenses,
      netProfit,
      startDate: start,
      endDate: end,
    });
  } catch (error) {
    console.error('Error generating P&L:', error);
    res.status(500).json({ error: 'Failed to generate P&L statement' });
  }
};

// GST REPORT
export const getGSTReport = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    const targetMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    const vouchers = await prisma.voucher.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: { in: ['SALES', 'PURCHASE'] },
        isDeleted: false,
      },
      include: { items: true, party: true },
    });

    let outputGST = 0; // Sales GST collected
    let inputGST = 0;  // Purchase GST paid
    const salesVouchers: any[] = [];
    const purchaseVouchers: any[] = [];

    vouchers.forEach((voucher) => {
      const totalGST = voucher.items.reduce((sum, item) => sum + item.gstAmount, 0);

      if (voucher.type === 'SALES') {
        outputGST += totalGST;
        salesVouchers.push({
          voucherNumber: voucher.voucherNumber,
          date: voucher.date,
          party: voucher.party?.name,
          gstNumber: voucher.party?.gstNumber,
          amount: voucher.totalAmount - totalGST,
          gst: totalGST,
          total: voucher.totalAmount,
        });
      } else if (voucher.type === 'PURCHASE') {
        inputGST += totalGST;
        purchaseVouchers.push({
          voucherNumber: voucher.voucherNumber,
          date: voucher.date,
          party: voucher.party?.name,
          gstNumber: voucher.party?.gstNumber,
          amount: voucher.totalAmount - totalGST,
          gst: totalGST,
          total: voucher.totalAmount,
        });
      }
    });

    const netGST = outputGST - inputGST;

    res.json({
      month: targetMonth + 1,
      year: targetYear,
      outputGST,
      inputGST,
      netGST,
      status: netGST > 0 ? 'Payable' : 'Refundable',
      salesVouchers,
      purchaseVouchers,
    });
  } catch (error) {
    console.error('Error generating GST report:', error);
    res.status(500).json({ error: 'Failed to generate GST report' });
  }
};

// OUTSTANDING REPORT
export const getOutstandingReport = async (req: Request, res: Response) => {
  try {
    const parties = await prisma.account.findMany({
      where: { isParty: true },
      include: {
        ledgerEntries: {
          where: {
            voucher: { isDeleted: false },
          },
        },
      },
    });

    const receivables: any[] = [];
    const payables: any[] = [];
    let totalReceivable = 0;
    let totalPayable = 0;

    parties.forEach((party) => {
      let balance = party.openingBalance;
      
      party.ledgerEntries.forEach((entry) => {
        balance += entry.debit - entry.credit;
      });

      if (balance !== 0) {
        const partyData = {
          id: party.id,
          name: party.name,
          gstNumber: party.gstNumber,
          balance: Math.abs(balance),
        };

        if (balance > 0) {
          // Positive balance = They owe us (Receivable)
          receivables.push(partyData);
          totalReceivable += balance;
        } else {
          // Negative balance = We owe them (Payable)
          payables.push(partyData);
          totalPayable += Math.abs(balance);
        }
      }
    });

    res.json({
      receivables,
      payables,
      totalReceivable,
      totalPayable,
      netPosition: totalReceivable - totalPayable,
    });
  } catch (error) {
    console.error('Error generating outstanding report:', error);
    res.status(500).json({ error: 'Failed to generate outstanding report' });
  }
};

// LEDGER for specific account
export const getLedger = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      accountId,
      voucher: { isDeleted: false },
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        voucher: {
          include: {
            party: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate running balance
    let balance = account.openingBalance;
    const ledgerEntries = entries.map((entry) => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: balance,
      };
    });

    res.json({
      account,
      entries: ledgerEntries,
      openingBalance: account.openingBalance,
      closingBalance: balance,
    });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
};