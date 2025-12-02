// app/reports/trial-balance/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { exportTrialBalanceToExcel } from '@/backend/lib/export';

interface TrialBalanceEntry {
  accountId: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  trialBalance: TrialBalanceEntry[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

export default function TrialBalancePage() {
  const router = useRouter();
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.trialBalance();
      setData(result);
    } catch (error) {
      console.error('Error fetching trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLargeCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1e11) {
      return `₹${amount.toExponential(2)}`;
    }
    return formatCurrency(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Failed to load trial balance</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trialBalance, totalDebit, totalCredit, balanced } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trial Balance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">As of {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportTrialBalanceToExcel(trialBalance, totalDebit, totalCredit)}
            className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Balance Status */}
      <div className="mb-6">
        {balanced ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg p-4 flex items-center">
            <div className="text-green-600 dark:text-green-400 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Books are balanced</p>
              <p className="text-sm text-green-700 dark:text-green-300">Total debits equal total credits</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 flex items-center">
            <div className="text-red-600 dark:text-red-400 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">Books are not balanced!</p>
              <p className="text-sm text-red-700 dark:text-red-300 truncate" title={formatCurrency(Math.abs(totalDebit - totalCredit))}>
                Difference: {formatLargeCurrency(Math.abs(totalDebit - totalCredit))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trial Balance Table */}
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                {trialBalance.map((entry) => (
                  <tr
                    key={entry.accountId}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => router.push(`/ledgers/${entry.accountId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded-full text-xs ${entry.accountType === 'ASSET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        entry.accountType === 'LIABILITY' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          entry.accountType === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                        {entry.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white truncate" title={entry.debit > 0 ? formatCurrency(entry.debit) : ''}>
                      {entry.debit > 0 ? formatLargeCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white truncate" title={entry.credit > 0 ? formatCurrency(entry.credit) : ''}>
                      {entry.credit > 0 ? formatLargeCurrency(entry.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-slate-800 font-bold border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(totalDebit)}>
                    {formatLargeCurrency(totalDebit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(totalCredit)}>
                    {formatLargeCurrency(totalCredit)}
                  </td>
                </tr>
                {!balanced && (
                  <tr className="bg-red-50 dark:bg-red-900/20">
                    <td colSpan={2} className="px-6 py-3 text-sm text-red-900 dark:text-red-300">
                      Difference
                    </td>
                    <td colSpan={2} className="px-6 py-3 text-sm text-right text-red-900 dark:text-red-300 truncate" title={formatCurrency(Math.abs(totalDebit - totalCredit))}>
                      {formatLargeCurrency(Math.abs(totalDebit - totalCredit))}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={formatCurrency(totalDebit)}>{formatLargeCurrency(totalDebit)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={formatCurrency(totalCredit)}>{formatLargeCurrency(totalCredit)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {balanced ? 'Balanced ✓' : 'Not Balanced ✗'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}