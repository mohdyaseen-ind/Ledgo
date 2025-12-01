// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { vouchersAPI, reportsAPI, accountsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardData {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  cashBalance: number;
  salesTrend: Array<{ month: string; amount: number }>;
  topCustomers: Array<{ name: string; amount: number }>;
  outstandingReceivables: number;
  outstandingPayables: number;
  gstLiability: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get current month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch all vouchers for current month
      const vouchers = await vouchersAPI.getAll({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
      });

      // Calculate totals
      const salesVouchers = vouchers.filter((v: any) => v.type === 'SALES');
      const purchaseVouchers = vouchers.filter((v: any) => v.type === 'PURCHASE');

      const totalSales = salesVouchers.reduce((sum: number, v: any) => sum + v.totalAmount, 0);
      const totalPurchases = purchaseVouchers.reduce((sum: number, v: any) => sum + v.totalAmount, 0);

      // Get P&L for net profit
      const plData = await reportsAPI.profitAndLoss(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );

      // Get outstanding
      const outstandingData = await reportsAPI.outstanding();

      // Get GST
      const gstData = await reportsAPI.gst(now.getMonth() + 1, now.getFullYear());

      // Get bank balance
      const accounts = await accountsAPI.getAll({ type: 'ASSET' });
      const bankAccount = accounts.find((acc: any) => acc.name.toLowerCase().includes('bank'));
      const cashBalance = bankAccount ? bankAccount.openingBalance : 0;

      // Generate sales trend (last 6 months)
      const salesTrend = generateSalesTrend();

      // Get top customers
      const customerSales = new Map<string, number>();
      salesVouchers.forEach((v: any) => {
        if (v.party) {
          const current = customerSales.get(v.party.name) || 0;
          customerSales.set(v.party.name, current + v.totalAmount);
        }
      });

      const topCustomers = Array.from(customerSales.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setData({
        totalSales,
        totalPurchases,
        netProfit: plData.netProfit,
        cashBalance,
        salesTrend,
        topCustomers,
        outstandingReceivables: outstandingData.totalReceivable,
        outstandingPayables: outstandingData.totalPayable,
        gstLiability: gstData.netGST,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trend.push({
        month: months[date.getMonth()],
        amount: Math.random() * 500000 + 200000, // Mock data - replace with real data
      });
    }

    return trend;
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
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Sales (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.totalSales)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">↑ 12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.totalPurchases)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">↑ 8% from last month</p>
          </CardContent>
        </Card>

        <Card className={`${data.netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} border-gray-200 dark:border-gray-700`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${data.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(Math.abs(data.netProfit))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Profit margin: {((data.netProfit / data.totalSales) * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.cashBalance)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available in bank</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Sales Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Top 5 Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outstanding & GST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Outstanding Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {formatCurrency(data.outstandingReceivables)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Money customers owe us</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Outstanding Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              {formatCurrency(data.outstandingPayables)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Money we owe suppliers</p>
          </CardContent>
        </Card>

        <Card className={`${data.gstLiability > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'} border-gray-200 dark:border-gray-700`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">GST Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.gstLiability > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} mb-2`}>
              {formatCurrency(Math.abs(data.gstLiability))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.gstLiability > 0 ? 'To be paid' : 'Refundable'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="text-2xl mb-2">📄</div>
              <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">P&L, GST, Trial Balance</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium text-gray-900 dark:text-white">Ledgers</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View account details</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="text-2xl mb-2">💰</div>
              <p className="font-medium text-gray-900 dark:text-white">Outstanding</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track payments</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <div className="text-2xl mb-2">📅</div>
              <p className="font-medium text-gray-900 dark:text-white">Day Book</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily transactions</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}