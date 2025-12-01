// app/ledgers/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { accountsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Account {
  id: string;
  name: string;
  type: string;
  isParty: boolean;
  openingBalance: number;
}

export default function LedgersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let filtered = accounts;

    if (filter !== 'ALL') {
      filtered = filtered.filter((acc) => acc.type === filter);
    }

    if (search) {
      filtered = filtered.filter((acc) =>
        acc.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  }, [accounts, filter, search]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.getAll({});
      setAccounts(data);
      setFilteredAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'LIABILITY':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'INCOME':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'EXPENSE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ledgers</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View all accounts and their transactions</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex space-x-2">
          {['ALL', 'ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <Link key={account.id} href={`/ledgers/${account.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{account.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAccountColor(account.type)}`}>
                        {account.type}
                      </span>
                    </div>
                  </div>

                  {account.isParty && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs">
                        Party Account
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Opening Balance</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={formatCurrency(account.openingBalance)}>
                      {formatLargeCurrency(account.openingBalance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {accounts.filter((a) => a.type === 'ASSET').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {accounts.filter((a) => a.type === 'LIABILITY').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Liabilities</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {accounts.filter((a) => a.type === 'INCOME').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {accounts.filter((a) => a.type === 'EXPENSE').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}