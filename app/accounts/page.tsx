'use client';

import { useEffect, useState } from 'react';
import { accountsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

interface Account {
    id: string;
    name: string;
    type: string;
    isParty: boolean;
    gstNumber?: string;
    openingBalance: number;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [filter, setFilter] = useState('ALL');

    // Form State
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'ASSET',
        isParty: false,
        gstNumber: '',
        openingBalance: 0,
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await accountsAPI.getAll();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await accountsAPI.create(newAccount);
            setIsCreating(false);
            setNewAccount({
                name: '',
                type: 'ASSET',
                isParty: false,
                gstNumber: '',
                openingBalance: 0,
            });
            fetchAccounts();
            alert('Account created successfully!');
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Failed to create account');
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        filter === 'ALL' ? true : acc.type === filter
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ledgers</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your Chart of Accounts</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : '+ Create Ledger'}
                </Button>
            </div>

            {/* Create Account Form */}
            {isCreating && (
                <Card className="mb-8 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">New Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <Input
                                        required
                                        value={newAccount.name}
                                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                        placeholder="e.g. HDFC Bank, Office Rent"
                                        className="bg-white dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        value={newAccount.type}
                                        onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="ASSET">Asset (Bank, Cash, Customer)</option>
                                        <option value="LIABILITY">Liability (Supplier, Loan)</option>
                                        <option value="INCOME">Income (Sales, Interest)</option>
                                        <option value="EXPENSE">Expense (Rent, Salary)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Balance</label>
                                    <Input
                                        type="number"
                                        value={newAccount.openingBalance}
                                        onChange={(e) => setNewAccount({ ...newAccount, openingBalance: parseFloat(e.target.value) || 0 })}
                                        className="bg-white dark:bg-slate-800"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="isParty"
                                        checked={newAccount.isParty}
                                        onChange={(e) => setNewAccount({ ...newAccount, isParty: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isParty" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Is this a Party? (Customer/Supplier)
                                    </label>
                                </div>
                                {newAccount.isParty && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                                        <Input
                                            value={newAccount.gstNumber}
                                            onChange={(e) => setNewAccount({ ...newAccount, gstNumber: e.target.value })}
                                            placeholder="e.g. 27AAAAA0000A1Z5"
                                            className="bg-white dark:bg-slate-800"
                                        />
                                    </div>
                                )}
                            </div>
                            <Button type="submit" className="w-full md:w-auto">
                                Create Ledger
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {['ALL', 'ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].map((type) => (
                    <Button
                        key={type}
                        variant={filter === type ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(type)}
                        className={filter !== type ? "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800" : ""}
                    >
                        {type}
                    </Button>
                ))}
            </div>

            {/* Accounts List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAccounts.map((account) => (
                        <Card key={account.id} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{account.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{account.type}</p>
                                        {account.gstNumber && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">GST: {account.gstNumber}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(account.openingBalance)}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Op. Bal</p>
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
