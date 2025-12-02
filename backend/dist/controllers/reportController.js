"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLedger = exports.getOutstandingReport = exports.getGSTReport = exports.getProfitAndLoss = exports.getTrialBalance = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// TRIAL BALANCE
const getTrialBalance = async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user.userId;
        const endDate = date ? new Date(date) : new Date();
        // Get all ledger entries up to date (scoped to user)
        const entries = await prisma_1.default.ledgerEntry.findMany({
            where: {
                userId,
                date: { lte: endDate },
                voucher: { isDeleted: false },
            },
            include: { account: true },
        });
        // Group by account
        const balances = new Map();
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
        // Add opening balances (scoped to user or global)
        const accounts = await prisma_1.default.account.findMany({
            where: {
                OR: [{ userId }, { userId: null }]
            }
        });
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
                }
                else {
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
    }
    catch (error) {
        console.error('Error generating trial balance:', error);
        res.status(500).json({ error: 'Failed to generate trial balance' });
    }
};
exports.getTrialBalance = getTrialBalance;
// PROFIT & LOSS
const getProfitAndLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.userId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        const entries = await prisma_1.default.ledgerEntry.findMany({
            where: {
                userId,
                date: { gte: start, lte: end },
                voucher: { isDeleted: false },
            },
            include: { account: true },
        });
        let totalIncome = 0;
        let totalExpenses = 0;
        const incomeAccounts = [];
        const expenseAccounts = [];
        // Group by account
        const accountTotals = new Map();
        entries.forEach((entry) => {
            const existing = accountTotals.get(entry.accountId) || {
                accountId: entry.accountId,
                accountName: entry.account.name,
                accountType: entry.account.type,
                amount: 0,
            };
            if (entry.account.type === 'INCOME') {
                existing.amount += entry.credit - entry.debit;
            }
            else if (entry.account.type === 'EXPENSE') {
                existing.amount += entry.debit - entry.credit;
            }
            accountTotals.set(entry.accountId, existing);
        });
        accountTotals.forEach((account) => {
            if (account.accountType === 'INCOME' && account.amount > 0) {
                incomeAccounts.push(account);
                totalIncome += account.amount;
            }
            else if (account.accountType === 'EXPENSE' && account.amount > 0) {
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
    }
    catch (error) {
        console.error('Error generating P&L:', error);
        res.status(500).json({ error: 'Failed to generate P&L statement' });
    }
};
exports.getProfitAndLoss = getProfitAndLoss;
// GST REPORT
const getGSTReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const userId = req.user.userId;
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const vouchers = await prisma_1.default.voucher.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
                type: { in: ['SALES', 'PURCHASE'] },
                isDeleted: false,
            },
            include: { items: true, party: true },
        });
        let outputGST = 0; // Sales GST collected
        let inputGST = 0; // Purchase GST paid
        const salesVouchers = [];
        const purchaseVouchers = [];
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
            }
            else if (voucher.type === 'PURCHASE') {
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
    }
    catch (error) {
        console.error('Error generating GST report:', error);
        res.status(500).json({ error: 'Failed to generate GST report' });
    }
};
exports.getGSTReport = getGSTReport;
// OUTSTANDING REPORT
const getOutstandingReport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const parties = await prisma_1.default.account.findMany({
            where: {
                isParty: true,
                OR: [{ userId }, { userId: null }]
            },
            include: {
                ledgerEntries: {
                    where: {
                        userId, // Only user's entries
                        voucher: { isDeleted: false },
                    },
                },
            },
        });
        const receivables = [];
        const payables = [];
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
                    receivables.push(partyData);
                    totalReceivable += balance;
                }
                else {
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
    }
    catch (error) {
        console.error('Error generating outstanding report:', error);
        res.status(500).json({ error: 'Failed to generate outstanding report' });
    }
};
exports.getOutstandingReport = getOutstandingReport;
// LEDGER for specific account
const getLedger = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.user.userId;
        const where = {
            accountId,
            userId,
            voucher: { isDeleted: false },
        };
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const entries = await prisma_1.default.ledgerEntry.findMany({
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
        const account = await prisma_1.default.account.findFirst({
            where: {
                id: accountId,
                OR: [{ userId }, { userId: null }]
            },
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
    }
    catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};
exports.getLedger = getLedger;
