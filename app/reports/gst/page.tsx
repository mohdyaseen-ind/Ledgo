// app/reports/gst/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportGSTToExcel } from '@/backend/lib/export';

interface GSTVoucher {
  voucherNumber: string;
  date: string;
  party: string;
  gstNumber: string;
  amount: number;
  gst: number;
  total: number;
}

interface GSTData {
  month: number;
  year: number;
  outputGST: number;
  inputGST: number;
  netGST: number;
  status: string;
  salesVouchers: GSTVoucher[];
  purchaseVouchers: GSTVoucher[];
}

export default function GSTPage() {
  const [data, setData] = useState<GSTData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  useEffect(() => {
    fetchGST();
  }, []);

  const fetchGST = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.gst(selectedMonth, selectedYear);
      setData(result);
    } catch (error) {
      console.error('Error fetching GST report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthYearChange = () => {
    fetchGST();
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
            <p className="text-gray-500 dark:text-gray-400">Failed to load GST report</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { outputGST, inputGST, netGST, status, salesVouchers, purchaseVouchers } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GST Report (GSTR-3B Summary)</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {months[selectedMonth - 1].label} {selectedYear}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportGSTToExcel(salesVouchers, purchaseVouchers, outputGST, inputGST, netGST, selectedMonth, selectedYear)}
            className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Month/Year Selector */}
      <Card className="mb-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Select
                label="Month"
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={months}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <Select
                label="Year"
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={years}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <Button onClick={handleMonthYearChange}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Output GST (Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 truncate" title={formatCurrency(outputGST)}>{formatLargeCurrency(outputGST)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">GST collected from customers</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Input GST (Purchases)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 truncate" title={formatCurrency(inputGST)}>{formatLargeCurrency(inputGST)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">GST paid to suppliers</p>
          </CardContent>
        </Card>

        <Card className={`${netGST > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'} border-gray-200 dark:border-gray-700`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Net GST ({status})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netGST > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} truncate`} title={formatCurrency(netGST)}>
              {formatLargeCurrency(Math.abs(netGST))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {netGST > 0 ? 'Amount to pay to government' : 'Refund claimable'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales (Output GST) */}
      <Card className="mb-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-gray-900 dark:text-white">Sales Vouchers (Output GST)</CardTitle>
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              {salesVouchers.length} transactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesVouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Voucher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GSTIN</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GST</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salesVouchers.map((voucher, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.voucherNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(voucher.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.party}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">{voucher.gstNumber}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.amount)}>{formatLargeCurrency(voucher.amount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium truncate" title={formatCurrency(voucher.gst)}>{formatLargeCurrency(voucher.gst)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.total)}>{formatLargeCurrency(voucher.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No sales vouchers for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchases (Input GST) */}
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-gray-900 dark:text-white">Purchase Vouchers (Input GST)</CardTitle>
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              {purchaseVouchers.length} transactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {purchaseVouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Voucher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GSTIN</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GST</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {purchaseVouchers.map((voucher, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.voucherNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(voucher.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.party}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">{voucher.gstNumber}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.amount)}>{formatLargeCurrency(voucher.amount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium truncate" title={formatCurrency(voucher.gst)}>{formatLargeCurrency(voucher.gst)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.total)}>{formatLargeCurrency(voucher.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No purchase vouchers for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}