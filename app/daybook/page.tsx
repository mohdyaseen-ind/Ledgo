// app/daybook/page.tsx

'use client';

import { useEffect, useState } from 'react';
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
      });
      setVouchers(result);
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
        return 'bg-green-100 text-green-800';
      case 'PURCHASE':
        return 'bg-blue-100 text-blue-800';
      case 'PAYMENT':
        return 'bg-red-100 text-red-800';
      case 'RECEIPT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Day Book</h1>
          <p className="text-gray-600 mt-1">All transactions for {formatDate(selectedDate)}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            Export PDF
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => exportDayBookToExcel(vouchers, selectedDate)}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1 max-w-xs">
              <Input
                type="date"
                label="Select Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateChange}>View</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDate(formatDateInput(new Date()));
                fetchDayBook();
              }}
            >
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(salesTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {vouchers.filter((v) => v.type === 'SALES').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(purchaseTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {vouchers.filter((v) => v.type === 'PURCHASE').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(paymentTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {vouchers.filter((v) => v.type === 'PAYMENT').length} vouchers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(receiptTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {vouchers.filter((v) => v.type === 'RECEIPT').length} vouchers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Transactions</CardTitle>
            <span className="text-sm text-gray-600">{vouchers.length} vouchers</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narration</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {voucher.voucherNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVoucherColor(voucher.type)}`}>
                          {voucher.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {voucher.party?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {voucher.narration || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(voucher.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(vouchers.reduce((sum, v) => sum + v.totalAmount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              <p>No transactions on this date</p>
              <p className="text-xs mt-1">Try selecting a different date</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Summary */}
      {vouchers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Money In</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesTotal + receiptTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Money Out</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(purchaseTotal + paymentTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  salesTotal + receiptTotal - purchaseTotal - paymentTotal >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(salesTotal + receiptTotal - purchaseTotal - paymentTotal))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}