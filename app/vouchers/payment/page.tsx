// app/vouchers/payment/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { accountsAPI, vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDateInput } from '@/lib/utils';

export default function PaymentVoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', gstNumber: '' });
  const [isCreatingBank, setIsCreatingBank] = useState(false);
  const [newBank, setNewBank] = useState({ name: '', openingBalance: 0 });

  // Form state
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [title, setTitle] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentType, setPaymentType] = useState<'supplier' | 'expense'>('supplier');
  const [partyId, setPartyId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [amount, setAmount] = useState(0);
  const [narration, setNarration] = useState('');

  const bankRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchData();
    if (id) {
      fetchVoucher(id);
    } else {
      setTimeout(() => bankRef.current?.focus(), 100);
    }
  }, [id]);

  const fetchVoucher = async (voucherId: string) => {
    try {
      setLoading(true);
      const data = await vouchersAPI.getById(voucherId);
      setDate(formatDateInput(new Date(data.date)));
      setTitle(data.title || '');
      setNarration(data.narration || '');
      setAmount(data.totalAmount);

      // Analyze ledger entries to populate form
      const bankEntry = data.ledgerEntries.find((e: any) => e.credit > 0);
      const otherEntry = data.ledgerEntries.find((e: any) => e.debit > 0);

      if (bankEntry) setBankAccountId(bankEntry.accountId);

      if (otherEntry) {
        // Check if it's an expense account (we need to know account types, but we fetch them in fetchData)
        // We can check the account type from the ledger entry if included, or infer
        // The backend getVoucher includes account details in ledgerEntries
        if (otherEntry.account.type === 'EXPENSE') {
          setPaymentType('expense');
          setExpenseAccountId(otherEntry.accountId);
        } else {
          setPaymentType('supplier');
          setPartyId(otherEntry.accountId);
        }
      }
    } catch (error) {
      console.error('Error fetching voucher:', error);
      alert('Failed to load voucher');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Get suppliers
      const suppliersData = await accountsAPI.getAll({ isParty: true, type: 'LIABILITY' });
      setSuppliers(suppliersData);

      // Get expense accounts
      const expensesData = await accountsAPI.getAll({ type: 'EXPENSE' });
      setExpenseAccounts(expensesData);

      // Get bank accounts
      const allAccounts = await accountsAPI.getAll({ type: 'ASSET' });
      const banks = allAccounts.filter((acc: any) =>
        acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('cash')
      );
      setBankAccounts(banks);
      if (banks.length > 0) {
        setBankAccountId(banks[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = paymentType === 'supplier' ? 'LIABILITY' : 'EXPENSE';
      const isParty = paymentType === 'supplier';

      const data = await accountsAPI.create({
        name: newAccount.name,
        type,
        isParty,
        gstNumber: isParty ? newAccount.gstNumber : undefined,
        openingBalance: 0,
      });

      if (paymentType === 'supplier') {
        setSuppliers([...suppliers, data]);
        setPartyId(data.id);
      } else {
        setExpenseAccounts([...expenseAccounts, data]);
        setExpenseAccountId(data.id);
      }

      setIsCreatingAccount(false);
      setNewAccount({ name: '', gstNumber: '' });
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account');
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await accountsAPI.create({
        name: newBank.name,
        type: 'ASSET',
        isParty: false,
        openingBalance: newBank.openingBalance,
      });
      setBankAccounts([...bankAccounts, data]);
      setBankAccountId(data.id);
      setIsCreatingBank(false);
      setNewBank({ name: '', openingBalance: 0 });
    } catch (error) {
      console.error('Error creating bank:', error);
      alert('Failed to create bank account');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankAccountId) {
      alert('Please select a bank account');
      return;
    }

    if (paymentType === 'supplier' && !partyId) {
      alert('Please select a supplier');
      return;
    }

    if (paymentType === 'expense' && !expenseAccountId) {
      alert('Please select an expense account');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setLoading(true);
      const voucherData = {
        type: 'PAYMENT',
        date,
        title,
        bankAccountId,
        partyId: paymentType === 'supplier' ? partyId : undefined,
        expenseAccountId: paymentType === 'expense' ? expenseAccountId : undefined,
        amount,
        narration,
      };

      if (id) {
        await vouchersAPI.update(id, voucherData);
        alert('Payment voucher updated successfully!');
      } else {
        await vouchersAPI.create(voucherData);
        alert('Payment voucher created successfully!');
      }

      router.push('/vouchers');
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      if (e.key === 'Escape') {
        if (confirm('Discard changes?')) {
          router.push('/vouchers');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bankAccountId, paymentType, partyId, expenseAccountId, amount]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{id ? 'Edit Payment Voucher' : 'Payment Voucher'}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{id ? 'Update existing payment' : 'Record money going out'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      ref={bankRef}
                      label="From Account *"
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Bank/Cash Account' },
                        ...bankAccounts.map((acc) => ({ value: acc.id, label: acc.name })),
                      ]}
                      required
                      className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreatingBank(true)}
                    className="mb-[2px] px-3"
                    title="Create New Bank/Cash Account"
                  >
                    +
                  </Button>
                </div>
              </div>
              <div>
                <Input
                  label="Title / Reference"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rent Payment"
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Date *"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Type
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={paymentType === 'supplier' ? 'primary' : 'secondary'}
                  onClick={() => setPaymentType('supplier')}
                  className={paymentType !== 'supplier' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700" : ""}
                >
                  To Supplier
                </Button>
                <Button
                  type="button"
                  variant={paymentType === 'expense' ? 'primary' : 'secondary'}
                  onClick={() => setPaymentType('expense')}
                  className={paymentType !== 'expense' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700" : ""}
                >
                  Direct Expense
                </Button>
              </div>
            </div>

            {/* Conditional Fields */}
            {paymentType === 'supplier' ? (
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      label="Supplier *"
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Supplier' },
                        ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                      ]}
                      required
                      className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreatingAccount(true)}
                    className="mb-[2px] px-3"
                    title="Create New Supplier"
                  >
                    +
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      label="Expense Account *"
                      value={expenseAccountId}
                      onChange={(e) => setExpenseAccountId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Expense' },
                        ...expenseAccounts.map((acc) => ({ value: acc.id, label: acc.name })),
                      ]}
                      required
                      className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreatingAccount(true)}
                    className="mb-[2px] px-3"
                    title="Create New Expense Account"
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <Input
                type="number"
                label="Amount *"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white min-w-0"
              />
            </div>

            {/* Narration */}
            <div>
              <Input
                label="Narration"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Payment description..."
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                💡 Ctrl+Enter to save • Esc to cancel
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/vouchers')}
                  className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    id ? 'Update Voucher' : 'Save Voucher'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Create Account Modal */}
      {isCreatingAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-96 shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {paymentType === 'supplier' ? 'New Supplier' : 'New Expense Head'}
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <Input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  required
                  autoFocus
                  placeholder={paymentType === 'supplier' ? "Supplier Name" : "Expense Name (e.g. Rent)"}
                  className="bg-white dark:bg-slate-800"
                />
              </div>
              {paymentType === 'supplier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                  <Input
                    value={newAccount.gstNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, gstNumber: e.target.value })}
                    placeholder="Optional"
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreatingAccount(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Bank Modal */}
      {isCreatingBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-96 shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">New Bank/Cash Account</h3>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                <Input
                  value={newBank.name}
                  onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
                  required
                  autoFocus
                  placeholder="e.g. HDFC Bank, Petty Cash"
                  className="bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Balance</label>
                <Input
                  type="number"
                  value={newBank.openingBalance}
                  onChange={(e) => setNewBank({ ...newBank, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreatingBank(false)}>Cancel</Button>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}