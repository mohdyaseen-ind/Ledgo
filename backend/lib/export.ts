// lib/export.ts

import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportTrialBalanceToExcel = (trialBalance: any[], totalDebit: number, totalCredit: number) => {
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
  
  exportToExcel(data, `Trial_Balance_${new Date().toISOString().split('T')[0]}`, 'Trial Balance');
};

export const exportPLToExcel = (incomeAccounts: any[], expenseAccounts: any[], totalIncome: number, totalExpenses: number, netProfit: number) => {
  const data: any[] = [];
  
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
  
  exportToExcel(data, `PL_Statement_${new Date().toISOString().split('T')[0]}`, 'P&L Statement');
};

export const exportGSTToExcel = (salesVouchers: any[], purchaseVouchers: any[], outputGST: number, inputGST: number, netGST: number, month: number, year: number) => {
  const data: any[] = [];
  
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
  
  exportToExcel(data, `GST_Report_${month}_${year}`, 'GST Report');
};

export const exportOutstandingToExcel = (receivables: any[], payables: any[], totalReceivable: number, totalPayable: number) => {
  const data: any[] = [];
  
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
  
  exportToExcel(data, `Outstanding_Report_${new Date().toISOString().split('T')[0]}`, 'Outstanding');
};

export const exportLedgerToExcel = (accountName: string, entries: any[], openingBalance: number, closingBalance: number) => {
  const data: any[] = [];
  
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
  
  exportToExcel(data, `Ledger_${accountName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`, 'Ledger');
};

export const exportDayBookToExcel = (vouchers: any[], selectedDate: string) => {
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
  
  exportToExcel(data, `Day_Book_${selectedDate}`, 'Day Book');
};