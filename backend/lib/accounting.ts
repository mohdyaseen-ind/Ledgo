type LedgerEntryInput = {
  accountId: string;
  debit: number;
  credit: number;
};

export class AccountingEngine {
  
  // SALES VOUCHER
  // Customer owes us money (Debit Debtor)
  // We earned revenue (Credit Sales)
  // We collected GST (Credit Output GST)
  static createSalesEntries(
    partyId: string,
    totalAmount: number,
    baseAmount: number,
    gstAmount: number,
    salesAccountId: string,
    outputGstAccountId: string
  ): LedgerEntryInput[] {
    return [
      {
        accountId: partyId, // Sundry Debtor (Asset increases)
        debit: totalAmount,
        credit: 0,
      },
      {
        accountId: salesAccountId, // Sales Income
        debit: 0,
        credit: baseAmount,
      },
      {
        accountId: outputGstAccountId, // Output GST (Liability)
        debit: 0,
        credit: gstAmount,
      },
    ];
  }

  // PURCHASE VOUCHER
  // We owe supplier money (Credit Creditor)
  // We have expense (Debit Purchase)
  // We get GST credit (Debit Input GST)
  static createPurchaseEntries(
    partyId: string,
    totalAmount: number,
    baseAmount: number,
    gstAmount: number,
    purchaseAccountId: string,
    inputGstAccountId: string
  ): LedgerEntryInput[] {
    return [
      {
        accountId: purchaseAccountId, // Purchase Expense
        debit: baseAmount,
        credit: 0,
      },
      {
        accountId: inputGstAccountId, // Input GST (Asset)
        debit: gstAmount,
        credit: 0,
      },
      {
        accountId: partyId, // Sundry Creditor (Liability increases)
        debit: 0,
        credit: totalAmount,
      },
    ];
  }

  // PAYMENT VOUCHER
  // Money goes out (Credit Bank)
  // Either pay supplier (Debit Creditor) OR direct expense (Debit Expense Account)
  static createPaymentEntries(
    bankAccountId: string,
    amount: number,
    partyId?: string,
    expenseAccountId?: string
  ): LedgerEntryInput[] {
    const entries: LedgerEntryInput[] = [
      {
        accountId: bankAccountId, // Bank/Cash reduces
        debit: 0,
        credit: amount,
      },
    ];

    if (partyId) {
      // Payment to supplier (reduces liability)
      entries.push({
        accountId: partyId,
        debit: amount,
        credit: 0,
      });
    } else if (expenseAccountId) {
      // Direct expense payment
      entries.push({
        accountId: expenseAccountId,
        debit: amount,
        credit: 0,
      });
    }

    return entries;
  }

  // RECEIPT VOUCHER
  // Money comes in (Debit Bank)
  // Either from customer (Credit Debtor) OR direct income (Credit Income Account)
  static createReceiptEntries(
    bankAccountId: string,
    amount: number,
    partyId?: string,
    incomeAccountId?: string
  ): LedgerEntryInput[] {
    const entries: LedgerEntryInput[] = [
      {
        accountId: bankAccountId, // Bank/Cash increases
        debit: amount,
        credit: 0,
      },
    ];

    if (partyId) {
      // Receipt from customer (reduces asset)
      entries.push({
        accountId: partyId,
        debit: 0,
        credit: amount,
      });
    } else if (incomeAccountId) {
      // Direct income receipt
      entries.push({
        accountId: incomeAccountId,
        debit: 0,
        credit: amount,
      });
    }

    return entries;
  }

  // Validation: Debits must equal Credits
  static validateEntries(entries: LedgerEntryInput[]): boolean {
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Allow tiny float errors
  }
}