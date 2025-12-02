// app/reports/outstanding/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { exportOutstandingToExcel } from '@/backend/lib/export';

interface Party {
  id: string;
  name: string;
  gstNumber?: string;
  balance: number;
}

interface OutstandingData {
  receivables: Party[];
  payables: Party[];
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
}

export default function OutstandingPage() {
  const router = useRouter();
  const [data, setData] = useState<OutstandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.outstanding();
      setData(result);
    } catch (error) {
      console.error('Error fetching outstanding report:', error);
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
            <p className="text-gray-500 dark:text-gray-400">Failed to load outstanding report</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { receivables, payables, totalReceivable, totalPayable, netPosition } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Outstanding Report</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Receivables & Payables as of {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportOutstandingToExcel(receivables, payables, totalReceivable, totalPayable)}
            className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 truncate" title={formatCurrency(totalReceivable)}>{formatLargeCurrency(totalReceivable)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {receivables.length} customer{receivables.length !== 1 ? 's' : ''} owe us
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 truncate" title={formatCurrency(totalPayable)}>{formatLargeCurrency(totalPayable)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              We owe {payables.length} supplier{payables.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className={`${netPosition >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} border-gray-200 dark:border-gray-700`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} truncate`} title={formatCurrency(netPosition)}>
              {formatLargeCurrency(Math.abs(netPosition))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {netPosition >= 0 ? 'Net receivable' : 'Net payable'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receivables (Customers who owe us) */}
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-900 dark:text-white">Receivables (Sundry Debtors)</CardTitle>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{receivables.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {receivables.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {receivables
                  .sort((a, b) => b.balance - a.balance)
                  .map((party) => (
                    <div
                      key={party.id}
                      className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() => router.push(`/ledgers/${party.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{party.name}</p>
                          {party.gstNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{party.gstNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate" title={formatCurrency(party.balance)}>
                            {formatLargeCurrency(party.balance)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="px-4 py-4 bg-green-50 dark:bg-green-900/20 font-bold border-t border-green-100 dark:border-green-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white">Total Receivables</span>
                    <span className="text-xl text-green-600 dark:text-green-400 truncate" title={formatCurrency(totalReceivable)}>{formatLargeCurrency(totalReceivable)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>No outstanding receivables</p>
                <p className="text-xs mt-1">All customers have paid in full</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payables (Suppliers we owe) */}
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-900 dark:text-white">Payables (Sundry Creditors)</CardTitle>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{payables.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {payables.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {payables
                  .sort((a, b) => b.balance - a.balance)
                  .map((party) => (
                    <div
                      key={party.id}
                      className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() => router.push(`/ledgers/${party.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{party.name}</p>
                          {party.gstNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{party.gstNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600 dark:text-red-400 truncate" title={formatCurrency(party.balance)}>
                            {formatLargeCurrency(party.balance)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="px-4 py-4 bg-red-50 dark:bg-red-900/20 font-bold border-t border-red-100 dark:border-red-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white">Total Payables</span>
                    <span className="text-xl text-red-600 dark:text-red-400 truncate" title={formatCurrency(totalPayable)}>{formatLargeCurrency(totalPayable)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>No outstanding payables</p>
                <p className="text-xs mt-1">All suppliers have been paid</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aging Analysis (Future Enhancement) */}
      <Card className="mt-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collections Priority</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Focus on collecting from top {Math.min(3, receivables.length)} customers who collectively owe{' '}
                {receivables.length > 0
                  ? formatLargeCurrency(receivables.slice(0, 3).reduce((sum, r) => sum + r.balance, 0))
                  : '₹0'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Priority</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Top {Math.min(3, payables.length)} suppliers require payment of{' '}
                {payables.length > 0
                  ? formatLargeCurrency(payables.slice(0, 3).reduce((sum, p) => sum + p.balance, 0))
                  : '₹0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}