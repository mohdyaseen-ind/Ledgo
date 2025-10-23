// app/reports/trial-balance/page.tsx

'use client';

import { useEffect, useState } from 'react';
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
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Failed to load trial balance</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-gray-600 mt-1">As of {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            Export PDF
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => exportTrialBalanceToExcel(trialBalance, totalDebit, totalCredit)}
          >
            Export Excel
        </Button>
        </div>
      </div>

      {/* Balance Status */}
      <div className="mb-6">
        {balanced ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <div className="text-green-600 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">Books are balanced</p>
              <p className="text-sm text-green-700">Total debits equal total credits</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-900">Books are not balanced!</p>
              <p className="text-sm text-red-700">
                Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trial Balance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trialBalance.map((entry) => (
                  <tr key={entry.accountId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.accountType === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                        entry.accountType === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                        entry.accountType === 'INCOME' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
                {!balanced && (
                  <tr className="bg-red-50">
                    <td colSpan={2} className="px-6 py-3 text-sm text-red-900">
                      Difference
                    </td>
                    <td colSpan={2} className="px-6 py-3 text-sm text-right text-red-900">
                      {formatCurrency(Math.abs(totalDebit - totalCredit))}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebit)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCredit)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balanced ? 'text-green-600' : 'text-red-600'}`}>
              {balanced ? 'Balanced ✓' : 'Not Balanced ✗'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}