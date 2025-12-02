// app/daybook/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils';
import { exportDayBookToExcel } from '@/backend/lib/export';

interface Voucher {
  id: string;
  voucherNumber: string;
  type: string;
  date: string;
  totalAmount: number;
  party?: {
    name: string;
  };
  narration?: string;
}

export default function DayBookPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    fetchDayBook();
  }, []);

  const fetchDayBook = async () => {
    try {
      setLoading(true);
      const result = await vouchersAPI.getAll({
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 1000, // Ensure we get all transactions for the day
      });
      // Handle paginated response structure { data, meta }
      const vouchersData = Array.isArray(result) ? result : result.data;
      setVouchers(vouchersData || []);
    } catch (error) {
      console.error('Error fetching day book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    fetchDayBook();
  };

  const getVoucherColor = (type: string) => {
    switch (type) {
      case 'SALES':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'PURCHASE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'PAYMENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'RECEIPT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatLargeCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1e11) {
      return `₹${amount.toExponential(2)}`;
    }
    return formatCurrency(amount);
  };

  // Calculate totals by type
  const salesTotal = vouchers
    .filter((v) => v.type === 'SALES')
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const purchaseTotal = vouchers
    .filter((v) => v.type === 'PURCHASE')
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const paymentTotal = vouchers
    .filter((v) => v.type === 'PAYMENT')
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const receiptTotal = vouchers
    .filter((v) => v.type === 'RECEIPT')
    .reduce((sum, v) => sum + v.totalAmount, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Day Book</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">All transactions for {formatDate(selectedDate)}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportDayBookToExcel(vouchers, selectedDate)}
            className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1 max-w-xs">
              <Input
                type="date"
                label="Select Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <Button onClick={handleDateChange}>View</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDate(formatDateInput(new Date()));
                fetchDayBook();
              }}
              className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 truncate" title={formatCurrency(salesTotal)}>{formatLargeCurrency(salesTotal)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {vouchers.filter((v) => v.type === 'SALES').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 truncate" title={formatCurrency(purchaseTotal)}>{formatLargeCurrency(purchaseTotal)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {vouchers.filter((v) => v.type === 'PURCHASE').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 truncate" title={formatCurrency(paymentTotal)}>{formatLargeCurrency(paymentTotal)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {vouchers.filter((v) => v.type === 'PAYMENT').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 truncate" title={formatCurrency(receiptTotal)}>{formatLargeCurrency(receiptTotal)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {vouchers.filter((v) => v.type === 'RECEIPT').length} vouchers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers List */}
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-gray-900 dark:text-white">All Transactions</CardTitle>
            <span className="text-sm text-gray-600 dark:text-gray-400">{vouchers.length} vouchers</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Voucher No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Narration</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {vouchers.map((voucher) => (
                    <tr
                      key={voucher.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() => router.push(`/vouchers/${voucher.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {voucher.voucherNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVoucherColor(voucher.type)}`}>
                          {voucher.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {voucher.party?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {voucher.narration || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.totalAmount)}>
                        {formatLargeCurrency(voucher.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-slate-900/50 font-bold border-t border-gray-200 dark:border-gray-700">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(vouchers.reduce((sum, v) => sum + v.totalAmount, 0))}>
                      {formatLargeCurrency(vouchers.reduce((sum, v) => sum + v.totalAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>No transactions on this date</p>
              <p className="text-xs mt-1">Try selecting a different date</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Summary */}
      {vouchers.length > 0 && (
        <Card className="mt-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Money In</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 truncate" title={formatCurrency(salesTotal + receiptTotal)}>
                  {formatLargeCurrency(salesTotal + receiptTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Money Out</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 truncate" title={formatCurrency(purchaseTotal + paymentTotal)}>
                  {formatLargeCurrency(purchaseTotal + paymentTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${salesTotal + receiptTotal - purchaseTotal - paymentTotal >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                  } truncate`} title={formatCurrency(Math.abs(salesTotal + receiptTotal - purchaseTotal - paymentTotal))}>
                  {formatLargeCurrency(Math.abs(salesTotal + receiptTotal - purchaseTotal - paymentTotal))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}