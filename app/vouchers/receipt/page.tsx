// app/vouchers/receipt/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { accountsAPI, vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDateInput } from '@/lib/utils';

export default function ReceiptVoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', gstNumber: '' });
  const [isCreatingBank, setIsCreatingBank] = useState(false);
  const [newBank, setNewBank] = useState({ name: '', openingBalance: 0 });

  // Form state
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [title, setTitle] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [receiptType, setReceiptType] = useState<'customer' | 'income'>('customer');
  const [partyId, setPartyId] = useState('');
  const [incomeAccountId, setIncomeAccountId] = useState('');
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
      const bankEntry = data.ledgerEntries.find((e: any) => e.debit > 0);
      const otherEntry = data.ledgerEntries.find((e: any) => e.credit > 0);

      if (bankEntry) setBankAccountId(bankEntry.accountId);

      if (otherEntry) {
        if (otherEntry.account.type === 'INCOME') {
          setReceiptType('income');
          setIncomeAccountId(otherEntry.accountId);
        } else {
          setReceiptType('customer');
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
      // Get customers
      const customersData = await accountsAPI.getAll({ isParty: true, type: 'ASSET' });
      setCustomers(customersData);

      // Get income accounts
      const incomeData = await accountsAPI.getAll({ type: 'INCOME' });
      setIncomeAccounts(incomeData);

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
      const type = receiptType === 'customer' ? 'ASSET' : 'INCOME';
      const isParty = receiptType === 'customer';

      const data = await accountsAPI.create({
        name: newAccount.name,
        type,
        isParty,
        gstNumber: isParty ? newAccount.gstNumber : undefined,
        openingBalance: 0,
      });

      if (receiptType === 'customer') {
        setCustomers([...customers, data]);
        setPartyId(data.id);
      } else {
        setIncomeAccounts([...incomeAccounts, data]);
        setIncomeAccountId(data.id);
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

    if (receiptType === 'customer' && !partyId) {
      alert('Please select a customer');
      return;
    }

    if (receiptType === 'income' && !incomeAccountId) {
      alert('Please select an income account');
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
        type: 'RECEIPT',
        date,
        title,
        bankAccountId,
        partyId: receiptType === 'customer' ? partyId : undefined,
        incomeAccountId: receiptType === 'income' ? incomeAccountId : undefined,
        amount,
        narration,
      };

      if (id) {
        await vouchersAPI.update(id, voucherData);
        alert('Receipt voucher updated successfully!');
      } else {
        await vouchersAPI.create(voucherData);
        alert('Receipt voucher created successfully!');
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
  }, [bankAccountId, receiptType, partyId, incomeAccountId, amount]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{id ? 'Edit Receipt Voucher' : 'Receipt Voucher'}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{id ? 'Update existing receipt' : 'Record money coming in'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      ref={bankRef}
                      label="To Account *"
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
                  placeholder="e.g. Client Advance"
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

            {/* Receipt Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt Type
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={receiptType === 'customer' ? 'primary' : 'secondary'}
                  onClick={() => setReceiptType('customer')}
                  className={receiptType !== 'customer' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700" : ""}
                >
                  From Customer
                </Button>
                <Button
                  type="button"
                  variant={receiptType === 'income' ? 'primary' : 'secondary'}
                  onClick={() => setReceiptType('income')}
                  className={receiptType !== 'income' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700" : ""}
                >
                  Direct Income
                </Button>
              </div>
            </div>

            {/* Conditional Fields */}
            {receiptType === 'customer' ? (
              <div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      label="Customer *"
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Customer' },
                        ...customers.map((c) => ({ value: c.id, label: c.name })),
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
                    title="Create New Customer"
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
                      label="Income Account *"
                      value={incomeAccountId}
                      onChange={(e) => setIncomeAccountId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Income' },
                        ...incomeAccounts.map((acc) => ({ value: acc.id, label: acc.name })),
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
                    title="Create New Income Account"
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
                placeholder="Receipt description..."
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
              {receiptType === 'customer' ? 'New Customer' : 'New Income Head'}
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <Input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  required
                  autoFocus
                  placeholder={receiptType === 'customer' ? "Customer Name" : "Income Name (e.g. Interest)"}
                  className="bg-white dark:bg-slate-800"
                />
              </div>
              {receiptType === 'customer' && (
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