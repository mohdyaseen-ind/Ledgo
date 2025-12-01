"use client"

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMode, setUser } from '@/store/slices/userSlice';
import { Button } from './ui/button';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useRouter } from 'next/navigation';

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentUser, mode } = useAppSelector((state) => state.user);

  const handleToggleMode = () => {
    dispatch(toggleMode());
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('accessToken');
      dispatch(setUser(null as any)); // Reset user in store
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">Ledgo</div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              mode === 'accountant' ? (
                <>
                  <div className="relative group flex items-center">
                    <Link href="/vouchers" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                      Vouchers ▾
                    </Link>
                    {/* Dropdown */}
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link href="/vouchers/sales" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        Sales (Ctrl+S)
                      </Link>
                      <Link href="/vouchers/purchase" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        Purchase (Ctrl+P)
                      </Link>
                      <Link href="/vouchers/payment" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        Payment (Ctrl+Y)
                      </Link>
                      <Link href="/vouchers/receipt" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        Receipt (Ctrl+R)
                      </Link>
                    </div>
                  </div>
                  <Link href="/ledgers" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    Ledgers
                  </Link>
                  <Link href="/reports/trial-balance" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    Reports
                  </Link>
                  <Link href="/daybook" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    Day Book
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    Dashboard
                  </Link>
                  <Link href="/reports/pl" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    P&L
                  </Link>
                  <Link href="/reports/gst" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    GST
                  </Link>
                  <Link href="/reports/outstanding" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                    Outstanding
                  </Link>
                </>
              )
            ) : null}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <ThemeToggle />

            {currentUser ? (
              <>
                {/* Mode indicator */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <Link href="/profile" className="font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                    {currentUser.name}
                  </Link>
                  <span className="mx-2">•</span>
                  <span className={mode === 'accountant' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
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

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </Button>

                {/* Keyboard hint */}
                <div className="hidden lg:block text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                  Alt+K
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}