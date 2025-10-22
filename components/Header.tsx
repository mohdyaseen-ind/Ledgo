// components/Header.tsx

'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMode } from '@/store/slices/userSlice';
import { Button } from './ui/button';
import Link from 'next/link';

export default function Header() {
  const dispatch = useAppDispatch();
  const { currentUser, mode } = useAppSelector((state) => state.user);

  const handleToggleMode = () => {
    dispatch(toggleMode());
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">ERP</div>
            <div className="text-sm text-gray-500">QuickBooks Killer</div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-4">
          {mode === 'accountant' ? (
              <>
                <div className="relative group">
                  <Link href="/vouchers" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                    Vouchers ▾
                  </Link>
                  {/* Dropdown */}
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/vouchers/sales" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Sales (Ctrl+S)
                    </Link>
                    <Link href="/vouchers/purchase" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Purchase (Ctrl+P)
                    </Link>
                    <Link href="/vouchers/payment" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Payment (Ctrl+Y)
                    </Link>
                    <Link href="/vouchers/receipt" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Receipt (Ctrl+R)
                    </Link>
                  </div>
                </div>
                <Link href="/ledgers" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Ledgers
                </Link>
                <Link href="/reports/trial-balance" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Reports
                </Link>
                <Link href="/daybook" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Day Book
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/reports/pl" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  P&L
                </Link>
                <Link href="/reports/gst" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  GST
                </Link>
                <Link href="/reports/outstanding" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Outstanding
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mode indicator */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentUser?.name}</span>
              <span className="mx-2">•</span>
              <span className={mode === 'accountant' ? 'text-blue-600' : 'text-green-600'}>
                {mode === 'accountant' ? '⌨️ Accountant' : '📊 Manager'}
              </span>
            </div>

            {/* Toggle button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleMode}
            >
              Switch to {mode === 'accountant' ? 'Manager' : 'Accountant'}
            </Button>

            {/* Keyboard hint */}
            <div className="hidden lg:block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Alt+K for commands
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}