// components/CommandPalette.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMode } from '@/store/slices/userSlice';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.user.mode);

  // Toggle with Alt+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.altKey)) || (e.key === 'K' && e.altKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = [
    // Voucher Creation
    {
      id: 'sales',
      label: 'New Sales Voucher',
      shortcut: 'Ctrl+S',
      keywords: ['invoice', 'bill', 'sale', 'customer'],
      action: () => {
        router.push('/vouchers/sales');
        setOpen(false);
      },
    },
    {
      id: 'purchase',
      label: 'New Purchase Voucher',
      shortcut: 'Ctrl+P',
      keywords: ['purchase', 'buy', 'supplier'],
      action: () => {
        router.push('/vouchers/purchase');
        setOpen(false);
      },
    },
    {
      id: 'payment',
      label: 'New Payment Voucher',
      shortcut: 'Ctrl+Y',
      keywords: ['payment', 'pay', 'expense'],
      action: () => {
        router.push('/vouchers/payment');
        setOpen(false);
      },
    },
    {
      id: 'receipt',
      label: 'New Receipt Voucher',
      shortcut: 'Ctrl+R',
      keywords: ['receipt', 'receive', 'income'],
      action: () => {
        router.push('/vouchers/receipt');
        setOpen(false);
      },
    },
    
    // Views
    {
      id: 'vouchers',
      label: 'View All Vouchers',
      shortcut: 'V',
      keywords: ['vouchers', 'transactions', 'list'],
      action: () => {
        router.push('/vouchers');
        setOpen(false);
      },
    },
    {
      id: 'ledgers',
      label: 'View Ledgers',
      shortcut: 'L',
      keywords: ['ledger', 'accounts', 'books'],
      action: () => {
        router.push('/ledgers');
        setOpen(false);
      },
    },
    {
      id: 'daybook',
      label: 'Day Book',
      shortcut: 'D',
      keywords: ['daybook', 'daily', 'today'],
      action: () => {
        router.push('/daybook');
        setOpen(false);
      },
    },
    
    // Reports
    {
      id: 'trial',
      label: 'Trial Balance',
      shortcut: 'T',
      keywords: ['trial', 'balance', 'report'],
      action: () => {
        router.push('/reports/trial-balance');
        setOpen(false);
      },
    },
    {
      id: 'pl',
      label: 'Profit & Loss Statement',
      shortcut: 'Alt+P',
      keywords: ['pl', 'profit', 'loss', 'income'],
      action: () => {
        router.push('/reports/pl');
        setOpen(false);
      },
    },
    {
      id: 'gst',
      label: 'GST Report',
      shortcut: 'G',
      keywords: ['gst', 'tax', 'goods and services'],
      action: () => {
        router.push('/reports/gst');
        setOpen(false);
      },
    },
    {
      id: 'outstanding',
      label: 'Outstanding Report',
      shortcut: 'O',
      keywords: ['outstanding', 'receivables', 'payables', 'dues'],
      action: () => {
        router.push('/reports/outstanding');
        setOpen(false);
      },
    },
    
    // Navigation
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortcut: 'Alt+D',
      keywords: ['dashboard', 'home', 'overview'],
      action: () => {
        router.push('/dashboard');
        setOpen(false);
      },
    },
    
    // Mode Toggle
    {
      id: 'toggle-mode',
      label: `Switch to ${mode === 'accountant' ? 'Manager' : 'Accountant'} Mode`,
      shortcut: 'Ctrl+M',
      keywords: ['mode', 'switch', 'toggle', 'accountant', 'manager'],
      action: () => {
        dispatch(toggleMode());
        setOpen(false);
      },
    },
  ];

  // Global keyboard shortcuts (outside command palette)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if command palette is open or user is typing
      if (open || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+S - Sales
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        router.push('/vouchers/sales');
      }
      // Ctrl+P - Purchase
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        router.push('/vouchers/purchase');
      }
      // Ctrl+M - Toggle Mode
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        dispatch(toggleMode());
      }
      // Single letter shortcuts (when not in input)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            router.push('/vouchers');
            break;
          case 'l':
            router.push('/ledgers');
            break;
          case 'd':
            router.push('/daybook');
            break;
          case 't':
            router.push('/reports/trial-balance');
            break;
          case 'g':
            router.push('/reports/gst');
            break;
          case 'o':
            router.push('/reports/outstanding');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleGlobalShortcuts);
    return () => document.removeEventListener('keydown', handleGlobalShortcuts);
  }, [open, router, dispatch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <Command className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-gray-200">
        <div className="border-b border-gray-200 px-4">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full py-4 text-lg outline-none"
            autoFocus
          />
        </div>
        
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Create Vouchers" className="text-xs text-gray-500 px-2 py-2 font-semibold">
            {commands
              .filter((cmd) => ['sales', 'purchase', 'payment', 'receipt'].includes(cmd.id))
              .map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 mb-1"
                  keywords={command.keywords}
                >
                  <span>{command.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {command.shortcut}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>

          <Command.Group heading="Navigation" className="text-xs text-gray-500 px-2 py-2 font-semibold mt-2">
            {commands
              .filter((cmd) => ['vouchers', 'ledgers', 'daybook', 'dashboard'].includes(cmd.id))
              .map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 mb-1"
                  keywords={command.keywords}
                >
                  <span>{command.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {command.shortcut}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>

          <Command.Group heading="Reports" className="text-xs text-gray-500 px-2 py-2 font-semibold mt-2">
            {commands
              .filter((cmd) => ['trial', 'pl', 'gst', 'outstanding'].includes(cmd.id))
              .map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 mb-1"
                  keywords={command.keywords}
                >
                  <span>{command.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {command.shortcut}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>

          <Command.Group heading="Settings" className="text-xs text-gray-500 px-2 py-2 font-semibold mt-2">
            {commands
              .filter((cmd) => cmd.id === 'toggle-mode')
              .map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 mb-1"
                  keywords={command.keywords}
                >
                  <span>{command.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {command.shortcut}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>
        </Command.List>

        <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
          <span className="mr-4">↑↓ Navigate</span>
          <span className="mr-4">↵ Select</span>
          <span>Esc Close</span>
        </div>
      </Command>
      
      {/* Click outside to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}