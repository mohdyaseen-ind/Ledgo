// app/reports/pl/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateInput } from '@/lib/utils';
import { exportPLToExcel } from '@/backend/lib/export';

interface PLAccount {
  accountId: string;
  accountName: string;
  accountType: string;
  amount: number;
}

interface PLData {
  incomeAccounts: PLAccount[];
  expenseAccounts: PLAccount[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  startDate: string;
  endDate: string;
}

export default function PLPage() {
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date range - default to current financial year
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(3); // April
    date.setDate(1);
    if (new Date().getMonth() < 3) {
      date.setFullYear(date.getFullYear() - 1);
    }
    return formatDateInput(date);
  });

  const [endDate, setEndDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    fetchPL();
  }, []);

  const fetchPL = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.profitAndLoss(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching P&L:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    fetchPL();
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
            <p className="text-gray-500 dark:text-gray-400">Failed to load P&L statement</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { incomeAccounts, expenseAccounts, totalIncome, totalExpenses, netProfit } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profit & Loss Statement</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {new Date(startDate).toLocaleDateString('en-IN')} to {new Date(endDate).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportPLToExcel(incomeAccounts, expenseAccounts, totalIncome, totalExpenses, netProfit)}
            className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <Button onClick={handleDateChange}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`${netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} border-gray-200 dark:border-gray-700`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Section */}
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30">
            <CardTitle className="text-gray-900 dark:text-white">Income</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Account
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {incomeAccounts.length > 0 ? (
                  incomeAccounts.map((account) => (
                    <tr key={account.accountId} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{account.accountName}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(account.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No income recorded
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-green-50 dark:bg-green-900/20 font-bold border-t border-green-100 dark:border-green-900/30">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total Income</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(totalIncome)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <CardTitle className="text-gray-900 dark:text-white">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Account
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenseAccounts.length > 0 ? (
                  expenseAccounts.map((account) => (
                    <tr key={account.accountId} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{account.accountName}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(account.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-red-50 dark:bg-red-900/20 font-bold border-t border-red-100 dark:border-red-900/30">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total Expenses</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                    {formatCurrency(totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Net Result */}
      <Card className={`mt-6 ${netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Net {netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {netProfit >= 0 ? 'Income exceeds expenses' : 'Expenses exceed income'}
              </p>
            </div>
            <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}