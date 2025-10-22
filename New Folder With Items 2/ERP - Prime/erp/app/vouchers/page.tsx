// app/vouchers/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

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

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchVouchers();
  }, [filter]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { type: filter } : {};
      const data = await vouchersAPI.getAll(params);
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-gray-600 mt-1">Manage all transactions</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/vouchers/sales">
            <Button>+ Sales (Ctrl+S)</Button>
          </Link>
          <Link href="/vouchers/purchase">
            <Button variant="secondary">+ Purchase (Ctrl+P)</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {['ALL', 'SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Vouchers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : vouchers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No vouchers found</p>
            <p className="text-sm text-gray-400 mt-2">Press Alt+K to create your first voucher</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVoucherColor(voucher.type)}`}>
                      {voucher.type}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{voucher.voucherNumber}</p>
                      <p className="text-sm text-gray-600">{voucher.party?.name || 'Direct Entry'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(voucher.date)}</p>
                      {voucher.narration && (
                        <p className="text-xs text-gray-400">{voucher.narration}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(voucher.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}