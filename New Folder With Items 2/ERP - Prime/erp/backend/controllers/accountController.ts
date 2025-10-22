// backend/controllers/accountController.ts

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET ALL ACCOUNTS
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { type, isParty } = req.query;

    const where: any = {};
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
    const { id } = req.params;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        ledgerEntries: {
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
    account.ledgerEntries.forEach((entry) => {
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
    const { name, type, isParty, gstNumber, openingBalance } = req.body;

    const account = await prisma.account.create({
      data: {
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