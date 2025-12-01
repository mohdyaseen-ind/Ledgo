import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET ALL ACCOUNTS
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { type, isParty }: any = req.query;
    const userId = (req as any).user.userId;

    const where: any = {
      OR: [
        { userId },
        { userId: null }
      ]
    };
    if (type) where.type = type;
    if (isParty !== undefined) where.isParty = isParty === 'true';

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

// GET SINGLE ACCOUNT
export const getAccount = async (req: Request, res: Response) => {
  try {
    const { id }: any = req.params;
    const userId = (req as any).user.userId;

    const account = await prisma.account.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      include: {
        ledgerEntries: {
          where: { userId }, // Only fetch ledger entries for this user
          include: {
            voucher: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate balance
    let balance = account.openingBalance;
    account.ledgerEntries.forEach((entry: any) => {
      balance += entry.debit - entry.credit;
    });

    res.json({ ...account, balance });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

// CREATE ACCOUNT
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, type, isParty, gstNumber, openingBalance }: any = req.body;
    const userId = (req as any).user.userId;

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        isParty: isParty || false,
        gstNumber,
        openingBalance: openingBalance || 0,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};
