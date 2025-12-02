"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVoucher = exports.deleteVoucher = exports.getVoucher = exports.getVouchers = exports.createVoucher = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const accounting_1 = require("../lib/accounting");
// Helper to generate voucher numbers
function generateVoucherNumber(type, count) {
    const prefix = {
        SALES: 'SV',
        PURCHASE: 'PV',
        PAYMENT: 'PY',
        RECEIPT: 'RC',
    }[type] || 'VO';
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}
// CREATE VOUCHER
const createVoucher = async (req, res) => {
    try {
        const { type, title, date, partyId, narration, items, bankAccountId, // For payment/receipt
        expenseAccountId, // For direct payment
        incomeAccountId, // For direct receipt
         } = req.body;
        const userId = req.user.userId;
        // Generate voucher number
        const count = await prisma_1.default.voucher.count({ where: { type, userId } });
        const voucherNumber = generateVoucherNumber(type, count);
        // Calculate total amount from items
        let totalAmount = 0;
        let baseAmount = 0;
        let gstAmount = 0;
        if (items && items.length > 0) {
            // Multi-line items (for Sales/Purchase)
            items.forEach((item) => {
                const itemAmount = item.quantity * item.rate;
                const itemGst = (itemAmount * item.gstRate) / 100;
                item.amount = itemAmount;
                item.gstAmount = itemGst;
                item.total = itemAmount + itemGst;
                baseAmount += itemAmount;
                gstAmount += itemGst;
                totalAmount += item.total;
            });
        }
        else {
            // Single amount (for Payment/Receipt)
            totalAmount = req.body.amount || 0;
        }
        // Get account IDs for ledger entries (scoped to user or global)
        const salesAccount = await prisma_1.default.account.findFirst({
            where: {
                name: 'Sales Account',
                OR: [{ userId }, { userId: null }]
            }
        });
        const purchaseAccount = await prisma_1.default.account.findFirst({
            where: {
                name: 'Purchase Account',
                OR: [{ userId }, { userId: null }]
            }
        });
        const outputGstAccount = await prisma_1.default.account.findFirst({
            where: {
                name: 'Output GST',
                OR: [{ userId }, { userId: null }]
            }
        });
        const inputGstAccount = await prisma_1.default.account.findFirst({
            where: {
                name: 'Input GST',
                OR: [{ userId }, { userId: null }]
            }
        });
        // Generate ledger entries based on voucher type
        let ledgerEntries = [];
        switch (type) {
            case 'SALES':
                if (!salesAccount || !outputGstAccount) {
                    return res.status(400).json({ error: 'Sales or Output GST account not found' });
                }
                ledgerEntries = accounting_1.AccountingEngine.createSalesEntries(partyId, totalAmount, baseAmount, gstAmount, salesAccount.id, outputGstAccount.id);
                break;
            case 'PURCHASE':
                if (!purchaseAccount || !inputGstAccount) {
                    return res.status(400).json({ error: 'Purchase or Input GST account not found' });
                }
                ledgerEntries = accounting_1.AccountingEngine.createPurchaseEntries(partyId, totalAmount, baseAmount, gstAmount, purchaseAccount.id, inputGstAccount.id);
                break;
            case 'PAYMENT':
                ledgerEntries = accounting_1.AccountingEngine.createPaymentEntries(bankAccountId, totalAmount, partyId, expenseAccountId);
                break;
            case 'RECEIPT':
                ledgerEntries = accounting_1.AccountingEngine.createReceiptEntries(bankAccountId, totalAmount, partyId, incomeAccountId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid voucher type' });
        }
        // Validate double-entry
        if (!accounting_1.AccountingEngine.validateEntries(ledgerEntries)) {
            return res.status(400).json({ error: 'Ledger entries do not balance' });
        }
        // Create voucher with items and ledger entries in a transaction
        const voucher = await prisma_1.default.$transaction(async (tx) => {
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
                    data: items.map((item) => ({
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
                data: ledgerEntries.map((entry) => ({
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
    }
    catch (error) {
        console.error('Error creating voucher:', error);
        res.status(500).json({ error: 'Failed to create voucher', details: error.message });
    }
};
exports.createVoucher = createVoucher;
// GET ALL VOUCHERS
const getVouchers = async (req, res) => {
    try {
        const { type, startDate, endDate, search, page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {
            userId,
            isDeleted: false,
        };
        if (type)
            where.type = type;
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (search) {
            where.OR = [
                { voucherNumber: { contains: search } },
                { title: { contains: search } },
                { party: { name: { contains: search } } },
            ];
        }
        const [vouchers, total] = await prisma_1.default.$transaction([
            prisma_1.default.voucher.findMany({
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
            prisma_1.default.voucher.count({ where }),
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
    }
    catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
};
exports.getVouchers = getVouchers;
// GET SINGLE VOUCHER
const getVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const voucher = await prisma_1.default.voucher.findFirst({
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
    }
    catch (error) {
        console.error('Error fetching voucher:', error);
        res.status(500).json({ error: 'Failed to fetch voucher' });
    }
};
exports.getVoucher = getVoucher;
// DELETE VOUCHER (soft delete)
const deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Verify ownership before deleting
        const existingVoucher = await prisma_1.default.voucher.findFirst({
            where: { id, userId },
        });
        if (!existingVoucher) {
            return res.status(404).json({ error: 'Voucher not found' });
        }
        const voucher = await prisma_1.default.voucher.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
        res.json({ message: 'Voucher deleted successfully', voucher });
    }
    catch (error) {
        console.error('Error deleting voucher:', error);
        res.status(500).json({ error: 'Failed to delete voucher' });
    }
};
exports.deleteVoucher = deleteVoucher;
// UPDATE VOUCHER
const updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, partyId, narration, items, bankAccountId, expenseAccountId, incomeAccountId, } = req.body;
        const userId = req.user.userId;
        // 1. Verify existence and ownership
        const existingVoucher = await prisma_1.default.voucher.findFirst({
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
            items.forEach((item) => {
                const itemAmount = item.quantity * item.rate;
                const itemGst = (itemAmount * item.gstRate) / 100;
                item.amount = itemAmount;
                item.gstAmount = itemGst;
                item.total = itemAmount + itemGst;
                baseAmount += itemAmount;
                gstAmount += itemGst;
                totalAmount += item.total;
            });
        }
        else {
            totalAmount = req.body.amount || 0;
        }
        // 3. Get accounts (scoped to user or global)
        const salesAccount = await prisma_1.default.account.findFirst({
            where: { name: 'Sales Account', OR: [{ userId }, { userId: null }] }
        });
        const purchaseAccount = await prisma_1.default.account.findFirst({
            where: { name: 'Purchase Account', OR: [{ userId }, { userId: null }] }
        });
        const outputGstAccount = await prisma_1.default.account.findFirst({
            where: { name: 'Output GST', OR: [{ userId }, { userId: null }] }
        });
        const inputGstAccount = await prisma_1.default.account.findFirst({
            where: { name: 'Input GST', OR: [{ userId }, { userId: null }] }
        });
        // 4. Generate new ledger entries
        let ledgerEntries = [];
        switch (type) {
            case 'SALES':
                if (!salesAccount || !outputGstAccount)
                    return res.status(400).json({ error: 'Sales/GST accounts missing' });
                ledgerEntries = accounting_1.AccountingEngine.createSalesEntries(partyId, totalAmount, baseAmount, gstAmount, salesAccount.id, outputGstAccount.id);
                break;
            case 'PURCHASE':
                if (!purchaseAccount || !inputGstAccount)
                    return res.status(400).json({ error: 'Purchase/GST accounts missing' });
                ledgerEntries = accounting_1.AccountingEngine.createPurchaseEntries(partyId, totalAmount, baseAmount, gstAmount, purchaseAccount.id, inputGstAccount.id);
                break;
            case 'PAYMENT':
                ledgerEntries = accounting_1.AccountingEngine.createPaymentEntries(bankAccountId, totalAmount, partyId, expenseAccountId);
                break;
            case 'RECEIPT':
                ledgerEntries = accounting_1.AccountingEngine.createReceiptEntries(bankAccountId, totalAmount, partyId, incomeAccountId);
                break;
        }
        // 5. Validate entries
        if (!accounting_1.AccountingEngine.validateEntries(ledgerEntries)) {
            return res.status(400).json({ error: 'Ledger entries do not balance' });
        }
        // 6. Transaction: Delete old, Update voucher, Create new
        const updatedVoucher = await prisma_1.default.$transaction(async (tx) => {
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
                    data: items.map((item) => ({
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
                data: ledgerEntries.map((entry) => ({
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
    }
    catch (error) {
        console.error('Error updating voucher:', error);
        res.status(500).json({ error: 'Failed to update voucher' });
    }
};
exports.updateVoucher = updateVoucher;
