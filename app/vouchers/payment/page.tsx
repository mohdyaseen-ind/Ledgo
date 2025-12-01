// app/vouchers/payment/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { accountsAPI, vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDateInput } from '@/lib/utils';

export default function PaymentVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Form state
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentType, setPaymentType] = useState<'supplier' | 'expense'>('supplier');
  const [partyId, setPartyId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [amount, setAmount] = useState(0);
  const [narration, setNarration] = useState('');

  const bankRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchData();
    setTimeout(() => bankRef.current?.focus(), 100);
  }, []);

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
      await vouchersAPI.create({
        type: 'PAYMENT',
        date,
        bankAccountId,
        partyId: paymentType === 'supplier' ? partyId : undefined,
        expenseAccountId: paymentType === 'expense' ? expenseAccountId : undefined,
        amount,
        narration,
      });

      alert('Payment voucher created successfully!');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Voucher</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Record money going out</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
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
            ) : (
              <div>
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
                    'Save Voucher'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}