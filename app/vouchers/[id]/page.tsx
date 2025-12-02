'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface VoucherItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    gstRate: number;
    gstAmount: number;
    total: number;
}

interface LedgerEntry {
    id: string;
    account: {
        name: string;
        type: string;
    };
    debit: number;
    credit: number;
}

interface Voucher {
    id: string;
    voucherNumber: string;
    title?: string;
    type: string;
    date: string;
    totalAmount: number;
    narration?: string;
    party?: {
        name: string;
        gstNumber?: string;
        address?: string;
    };
    items: VoucherItem[];
    ledgerEntries: LedgerEntry[];
}

export default function VoucherDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVoucher();
    }, [id]);

    const fetchVoucher = async () => {
        try {
            setLoading(true);
            const data = await vouchersAPI.getById(id);
            setVoucher(data);
        } catch (error) {
            console.error('Error fetching voucher:', error);
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

    const getVoucherColor = (type: string) => {
        switch (type) {
            case 'SALES':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'PURCHASE':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PAYMENT':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'RECEIPT':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const handleEdit = () => {
        if (voucher) {
            const type = voucher.type.toLowerCase();
            router.push(`/vouchers/${type}?id=${id}`);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) {
            try {
                setLoading(true);
                await vouchersAPI.delete(id);
                router.push('/vouchers');
            } catch (error) {
                console.error('Error deleting voucher:', error);
                alert('Failed to delete voucher');
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!voucher) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">Voucher not found</p>
                        <Button className="mt-4" onClick={() => router.push('/vouchers')}>
                            Back to Vouchers
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/vouchers')} className="mb-2 -ml-2 text-gray-600 dark:text-gray-400">
                        ← Back to List
                    </Button>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {voucher.title ? (
                                <span>{voucher.title} <span className="text-xl font-normal text-gray-500 dark:text-gray-500">({voucher.voucherNumber})</span></span>
                            ) : (
                                voucher.voucherNumber
                            )}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVoucherColor(voucher.type)}`}>
                            {voucher.type}
                        </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(voucher.date)}
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => window.print()}>
                        🖨️ Print
                    </Button>
                    <Button variant="secondary" onClick={handleEdit}>
                        ✏️ Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                        🗑️ Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Party Details */}
                <Card className="md:col-span-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {voucher.type === 'SALES' || voucher.type === 'RECEIPT' ? 'Billed To' : 'Billed From'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {voucher.party ? (
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{voucher.party.name}</p>
                                {voucher.party.gstNumber && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">GSTIN: {voucher.party.gstNumber}</p>
                                )}
                                {voucher.party.address && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">{voucher.party.address}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">Direct Entry (No Party)</p>
                        )}
                    </CardContent>
                </Card>

                {/* Amount Summary */}
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.totalAmount)}>
                            {formatLargeCurrency(voucher.totalAmount)}
                        </p>
                        {voucher.narration && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Narration</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{voucher.narration}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Items Table (Only for Sales/Purchase) */}
            {voucher.items && voucher.items.length > 0 && (
                <Card className="mb-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GST</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {voucher.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.rate)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                                {formatCurrency(item.gstAmount)} <span className="text-xs">({item.gstRate}%)</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white truncate" title={formatCurrency(item.total)}>
                                                {formatLargeCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-slate-800/50 font-bold border-t border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">Total</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={formatCurrency(voucher.totalAmount)}>
                                            {formatLargeCurrency(voucher.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Accounting Entries (Ledger View) */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accounting Entries</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Debit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {voucher.ledgerEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {entry.account.name}
                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                {entry.account.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={entry.debit > 0 ? formatCurrency(entry.debit) : ''}>
                                            {entry.debit > 0 ? formatLargeCurrency(entry.debit) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white truncate" title={entry.credit > 0 ? formatCurrency(entry.credit) : ''}>
                                            {entry.credit > 0 ? formatLargeCurrency(entry.credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
