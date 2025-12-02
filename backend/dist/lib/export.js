"use strict";
// lib/export.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLedgerToPDF = exports.exportDayBookToExcel = exports.exportLedgerToExcel = exports.exportOutstandingToExcel = exports.exportGSTToExcel = exports.exportPLToExcel = exports.exportTrialBalanceToExcel = exports.exportToExcel = void 0;
const XLSX = __importStar(require("xlsx"));
const jspdf_1 = __importDefault(require("jspdf"));
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    // Generate file
    XLSX.writeFile(wb, `${filename}.xlsx`);
};
exports.exportToExcel = exportToExcel;
const exportTrialBalanceToExcel = (trialBalance, totalDebit, totalCredit) => {
    const data = trialBalance.map(entry => ({
        'Account Name': entry.accountName,
        'Account Type': entry.accountType,
        'Debit': entry.debit > 0 ? entry.debit : '',
        'Credit': entry.credit > 0 ? entry.credit : '',
    }));
    // Add totals row
    data.push({
        'Account Name': 'TOTAL',
        'Account Type': '',
        'Debit': totalDebit,
        'Credit': totalCredit,
    });
    (0, exports.exportToExcel)(data, `Trial_Balance_${new Date().toISOString().split('T')[0]}`, 'Trial Balance');
};
exports.exportTrialBalanceToExcel = exportTrialBalanceToExcel;
const exportPLToExcel = (incomeAccounts, expenseAccounts, totalIncome, totalExpenses, netProfit) => {
    const data = [];
    // Income section
    data.push({ 'Type': 'INCOME', 'Account': '', 'Amount': '' });
    incomeAccounts.forEach(acc => {
        data.push({
            'Type': '',
            'Account': acc.accountName,
            'Amount': acc.amount,
        });
    });
    data.push({ 'Type': '', 'Account': 'Total Income', 'Amount': totalIncome });
    data.push({ 'Type': '', 'Account': '', 'Amount': '' }); // Empty row
    // Expense section
    data.push({ 'Type': 'EXPENSES', 'Account': '', 'Amount': '' });
    expenseAccounts.forEach(acc => {
        data.push({
            'Type': '',
            'Account': acc.accountName,
            'Amount': acc.amount,
        });
    });
    data.push({ 'Type': '', 'Account': 'Total Expenses', 'Amount': totalExpenses });
    data.push({ 'Type': '', 'Account': '', 'Amount': '' }); // Empty row
    // Net profit
    data.push({
        'Type': '',
        'Account': netProfit >= 0 ? 'Net Profit' : 'Net Loss',
        'Amount': Math.abs(netProfit),
    });
    (0, exports.exportToExcel)(data, `PL_Statement_${new Date().toISOString().split('T')[0]}`, 'P&L Statement');
};
exports.exportPLToExcel = exportPLToExcel;
const exportGSTToExcel = (salesVouchers, purchaseVouchers, outputGST, inputGST, netGST, month, year) => {
    const data = [];
    // Summary
    data.push({ 'Description': 'GST Report Summary', 'Value': '' });
    data.push({ 'Description': 'Month', 'Value': `${month}/${year}` });
    data.push({ 'Description': 'Output GST (Sales)', 'Value': outputGST });
    data.push({ 'Description': 'Input GST (Purchases)', 'Value': inputGST });
    data.push({ 'Description': 'Net GST Liability', 'Value': netGST });
    data.push({ 'Description': '', 'Value': '' }); // Empty row
    // Sales vouchers
    data.push({ 'Voucher': 'SALES VOUCHERS', 'Date': '', 'Party': '', 'GSTIN': '', 'Amount': '', 'GST': '', 'Total': '' });
    salesVouchers.forEach(v => {
        data.push({
            'Voucher': v.voucherNumber,
            'Date': new Date(v.date).toLocaleDateString('en-IN'),
            'Party': v.party,
            'GSTIN': v.gstNumber,
            'Amount': v.amount,
            'GST': v.gst,
            'Total': v.total,
        });
    });
    data.push({ 'Voucher': '', 'Date': '', 'Party': '', 'GSTIN': '', 'Amount': '', 'GST': '', 'Total': '' }); // Empty row
    // Purchase vouchers
    data.push({ 'Voucher': 'PURCHASE VOUCHERS', 'Date': '', 'Party': '', 'GSTIN': '', 'Amount': '', 'GST': '', 'Total': '' });
    purchaseVouchers.forEach(v => {
        data.push({
            'Voucher': v.voucherNumber,
            'Date': new Date(v.date).toLocaleDateString('en-IN'),
            'Party': v.party,
            'GSTIN': v.gstNumber,
            'Amount': v.amount,
            'GST': v.gst,
            'Total': v.total,
        });
    });
    (0, exports.exportToExcel)(data, `GST_Report_${month}_${year}`, 'GST Report');
};
exports.exportGSTToExcel = exportGSTToExcel;
const exportOutstandingToExcel = (receivables, payables, totalReceivable, totalPayable) => {
    const data = [];
    // Receivables
    data.push({ 'Type': 'RECEIVABLES (Customers)', 'Party': '', 'GSTIN': '', 'Amount': '' });
    receivables.forEach(r => {
        data.push({
            'Type': '',
            'Party': r.name,
            'GSTIN': r.gstNumber || '',
            'Amount': r.balance,
        });
    });
    data.push({ 'Type': '', 'Party': 'Total Receivables', 'GSTIN': '', 'Amount': totalReceivable });
    data.push({ 'Type': '', 'Party': '', 'GSTIN': '', 'Amount': '' }); // Empty row
    // Payables
    data.push({ 'Type': 'PAYABLES (Suppliers)', 'Party': '', 'GSTIN': '', 'Amount': '' });
    payables.forEach(p => {
        data.push({
            'Type': '',
            'Party': p.name,
            'GSTIN': p.gstNumber || '',
            'Amount': p.balance,
        });
    });
    data.push({ 'Type': '', 'Party': 'Total Payables', 'GSTIN': '', 'Amount': totalPayable });
    (0, exports.exportToExcel)(data, `Outstanding_Report_${new Date().toISOString().split('T')[0]}`, 'Outstanding');
};
exports.exportOutstandingToExcel = exportOutstandingToExcel;
const exportLedgerToExcel = (accountName, entries, openingBalance, closingBalance) => {
    const data = [];
    // Header
    data.push({ 'Date': 'Ledger Report', 'Voucher': accountName, 'Particulars': '', 'Debit': '', 'Credit': '', 'Balance': '' });
    data.push({ 'Date': '', 'Voucher': '', 'Particulars': '', 'Debit': '', 'Credit': '', 'Balance': '' });
    // Opening balance
    data.push({
        'Date': '',
        'Voucher': 'Opening Balance',
        'Particulars': '',
        'Debit': '',
        'Credit': '',
        'Balance': openingBalance,
    });
    // Entries
    entries.forEach(entry => {
        data.push({
            'Date': new Date(entry.date).toLocaleDateString('en-IN'),
            'Voucher': entry.voucher.voucherNumber,
            'Particulars': entry.voucher.party?.name || 'Direct Entry',
            'Debit': entry.debit > 0 ? entry.debit : '',
            'Credit': entry.credit > 0 ? entry.credit : '',
            'Balance': entry.runningBalance,
        });
    });
    // Closing balance
    data.push({
        'Date': '',
        'Voucher': 'Closing Balance',
        'Particulars': '',
        'Debit': '',
        'Credit': '',
        'Balance': closingBalance,
    });
    (0, exports.exportToExcel)(data, `Ledger_${accountName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`, 'Ledger');
};
exports.exportLedgerToExcel = exportLedgerToExcel;
const exportDayBookToExcel = (vouchers, selectedDate) => {
    const data = vouchers.map(v => ({
        'Voucher Number': v.voucherNumber,
        'Type': v.type,
        'Party': v.party?.name || '-',
        'Narration': v.narration || '-',
        'Amount': v.totalAmount,
    }));
    const total = vouchers.reduce((sum, v) => sum + v.totalAmount, 0);
    data.push({
        'Voucher Number': '',
        'Type': '',
        'Party': '',
        'Narration': 'TOTAL',
        'Amount': total,
    });
    (0, exports.exportToExcel)(data, `Day_Book_${selectedDate}`, 'Day Book');
    (0, exports.exportToExcel)(data, `Day_Book_${selectedDate}`, 'Day Book');
};
exports.exportDayBookToExcel = exportDayBookToExcel;
const exportLedgerToPDF = (accountName, entries, openingBalance, closingBalance) => {
    const doc = new jspdf_1.default();
    // Title
    doc.setFontSize(18);
    doc.text(accountName, 14, 22);
    doc.setFontSize(11);
    doc.text(`Ledger Report`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    // Table Data
    const tableData = entries.map(entry => [
        new Date(entry.date).toLocaleDateString('en-IN'),
        entry.voucher.voucherNumber,
        entry.voucher.party?.name || 'Direct Entry',
        entry.voucher.type,
        entry.debit > 0 ? entry.debit.toFixed(2) : '',
        entry.credit > 0 ? entry.credit.toFixed(2) : '',
        entry.runningBalance.toFixed(2)
    ]);
    // Add Opening Balance Row
    tableData.unshift([
        '',
        'Opening Balance',
        '',
        '',
        '',
        '',
        openingBalance.toFixed(2)
    ]);
    // Add Closing Balance Row
    tableData.push([
        '',
        'Closing Balance',
        '',
        '',
        '',
        '',
        closingBalance.toFixed(2)
    ]);
    (0, jspdf_autotable_1.default)(doc, {
        head: [['Date', 'Voucher', 'Particulars', 'Type', 'Debit', 'Credit', 'Balance']],
        body: tableData,
        startY: 44,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right', fontStyle: 'bold' },
        },
    });
    doc.save(`Ledger_${accountName.replace(/\s+/g, '_')}.pdf`);
};
exports.exportLedgerToPDF = exportLedgerToPDF;
