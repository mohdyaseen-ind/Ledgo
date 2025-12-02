// app/ledgers/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils';
import { exportLedgerToExcel } from '@/backend/lib/export';

interface LedgerEntry {
  id: string;
  date: string;
  debit: number;
  credit: number;
  runningBalance: number;
  voucher: {
    id: string;
    voucherNumber: string;
    type: string;
    narration?: string;
    party?: {
      name: string;
    };
  };
}

interface LedgerData {
  account: {
    id: string;
    name: string;
    type: string;
    gstNumber?: string;
    openingBalance: number;
  };
  entries: LedgerEntry[];
  openingBalance: number;
  closingBalance: number;
}

export default function LedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    fetchLedger();
  }, [accountId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.ledger(
        accountId,
        startDate || undefined,
        endDate || undefined
      );
      setData(result);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchLedger();
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
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Failed to load ledger</p>
            <Button className="mt-4" onClick={() => router.push('/ledgers')}>
              Back to Ledgers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { account, entries, openingBalance, closingBalance } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/ledgers')} className="mb-2">
            ← Back to Ledgers
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${account.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
              account.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                account.type === 'INCOME' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
              }`}>
              {account.type}
            </span>
            {account.gstNumber && (
              <span className="text-sm text-gray-600 font-mono">{account.gstNumber}</span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            Export PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportLedgerToExcel(account.name, entries, openingBalance, closingBalance)}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Opening Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 truncate" title={formatCurrency(openingBalance)}>{formatLargeCurrency(openingBalance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
          </CardContent>
        </Card>

        <Card className={closingBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}>
          <CardHeader>
            <CardTitle className="text-sm">Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'} truncate`} title={formatCurrency(closingBalance)}>
              {formatLargeCurrency(Math.abs(closingBalance))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateFilter}>Apply</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate('');
                setEndDate(formatDateInput(new Date()));
                fetchLedger();
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                      Opening Balance
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 truncate" title={formatCurrency(openingBalance)}>
                      {formatLargeCurrency(openingBalance)}
                    </td>
                  </tr>

                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/vouchers/${entry.voucher.id}`)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.voucher.voucherNumber}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${getVoucherColor(entry.voucher.type)}`}>
                            {entry.voucher.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          {entry.voucher.party?.name || 'Direct Entry'}
                        </div>
                        {entry.voucher.narration && (
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.voucher.narration}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 truncate" title={entry.debit > 0 ? formatCurrency(entry.debit) : ''}>
                        {entry.debit > 0 ? formatLargeCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 truncate" title={entry.credit > 0 ? formatCurrency(entry.credit) : ''}>
                        {entry.credit > 0 ? formatLargeCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 truncate" title={formatCurrency(entry.runningBalance)}>
                        {formatLargeCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}

                  {/* Closing Balance Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                      Closing Balance
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className={`px-4 py-3 text-sm text-right ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'} truncate`} title={formatCurrency(closingBalance)}>
                      {formatLargeCurrency(Math.abs(closingBalance))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              <p>No transactions found</p>
              <p className="text-xs mt-1">This account has no entries for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}