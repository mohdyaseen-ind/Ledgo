// app/vouchers/purchase/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { accountsAPI, vouchersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDateInput, calculateGST } from '@/lib/utils';

interface Item {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export default function PurchaseVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Form state
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [partyId, setPartyId] = useState('');
  const [narration, setNarration] = useState('');
  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gstRate: 18,
      gstAmount: 0,
      total: 0,
    },
  ]);

  // Refs for keyboard navigation
  const partyRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchSuppliers();
    setTimeout(() => partyRef.current?.focus(), 100);
  }, []);

  const fetchSuppliers = async () => {
    try {
      // Get suppliers (LIABILITY type parties)
      const data = await accountsAPI.getAll({ isParty: true, type: 'LIABILITY' });
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleItemChange = (id: string, field: keyof Item, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
          const amount = updated.quantity * updated.rate;
          const { gstAmount, total } = calculateGST(amount, updated.gstRate);
          updated.amount = amount;
          updated.gstAmount = gstAmount;
          updated.total = total;
        }

        return updated;
      })
    );
  };

  const addItem = () => {
    const newItem: Item = {
      id: `item-${items.length + 1}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gstRate: 18,
      gstAmount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partyId) {
      alert('Please select a supplier');
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    try {
      setLoading(true);
      await vouchersAPI.create({
        type: 'PURCHASE',
        date,
        partyId,
        narration,
        items: items.map(({ id, ...item }) => item),
        amount: totalAmount,
      });
      
      alert('Purchase voucher created successfully!');
      router.push('/vouchers');
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addItem();
      }
      if (e.key === 'Escape') {
        if (confirm('Discard changes?')) {
          router.push('/vouchers');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [partyId, items]);

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalGST = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const baseAmount = totalAmount - totalGST;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchase Voucher</h1>
        <p className="text-gray-600 mt-1">Record purchases from suppliers</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Voucher Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  ref={partyRef}
                  label="Supplier *"
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Supplier' },
                    ...suppliers.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  required
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Date *"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  + Add Line (Ctrl+N)
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">Rate</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">GST%</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Amount</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.rate}
                            onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(item.id, 'gstRate', parseFloat(e.target.value))}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          ₹{item.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">₹{baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">₹{totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Narration"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                💡 Ctrl+Enter to save • Ctrl+N for new line • Esc to cancel
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/vouchers')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Voucher'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}