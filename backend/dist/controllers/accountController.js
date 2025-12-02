"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = exports.getAccount = exports.getAccounts = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// GET ALL ACCOUNTS
const getAccounts = async (req, res) => {
    try {
        const { type, isParty } = req.query;
        const userId = req.user.userId;
        const where = {
            OR: [
                { userId },
                { userId: null }
            ]
        };
        if (type)
            where.type = type;
        if (isParty !== undefined)
            where.isParty = isParty === 'true';
        const accounts = await prisma_1.default.account.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(accounts);
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};
exports.getAccounts = getAccounts;
// GET SINGLE ACCOUNT
const getAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.findFirst({
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
        account.ledgerEntries.forEach((entry) => {
            balance += entry.debit - entry.credit;
        });
        res.json({ ...account, balance });
    }
    catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
};
exports.getAccount = getAccount;
// CREATE ACCOUNT
const createAccount = async (req, res) => {
    try {
        const { name, type, isParty, gstNumber, openingBalance } = req.body;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.create({
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
    }
    catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
};
exports.createAccount = createAccount;
