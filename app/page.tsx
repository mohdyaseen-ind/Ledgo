'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleMode } from '@/store/slices/userSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser, mode } = useAppSelector((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py bg-white/20 backdrop-blur-lg rounded-full text-white mb-8 animate-fade-in-up">
            <span className="animate-pulse mr-2">⚡</span>
            <span className="font-semibold">The Future of ERP is Here</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-7xl md:text-8xl font-black mb-6 text-white animate-fade-in-up animation-delay-200">
            Ledgo
            <br />
          </h1>

          <p className="text-2xl md:text-3xl text-white/90 mb-4 animate-fade-in-up animation-delay-400 font-light">
            The only ERP that <span className="font-bold underline decoration-yellow-300">doesn't suck</span>
          </p>

          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto animate-fade-in-up animation-delay-600">
            Keyboard shortcuts so fast, your accountants will cry tears of joy.
            <br />
            Dashboards so beautiful, your CFO will frame them.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-800">
            <Button
              size="lg"
              onClick={() => {
                if (currentUser) {
                  router.push(mode === 'manager' ? '/dashboard' : '/vouchers');
                } else {
                  router.push('/login');
                }
              }}
              className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl font-bold"
            >
              {currentUser ? '🚀 Launch App' : '🔐 Login to Start'}
            </Button>
            {currentUser && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-lg px-8 py-6 bg-white/10 backdrop-blur text-white hover:bg-white/20 hover:scale-105 transition-all border-2 border-white/50"
              >
                ✨ See Magic
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in-up animation-delay-1000">
            {[
              { number: '0', label: 'Mouse Clicks Needed', icon: '🖱️' },
              { number: '∞', label: 'Keyboard Shortcuts', icon: '⌨️' },
              { number: '100%', label: 'Faster than Tally', icon: '⚡' },
              { number: '0₹', label: 'Cost (Open Source)', icon: '💰' },
            ].map((stat, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white dark:bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Why This Changes Everything
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Not just another ERP. A revolution.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16 text-gray-900 dark:text-white">
              {[
                {
                  icon: '⚡',
                  title: 'Alt+K = Instant Everything',
                  description: 'Command palette that makes you feel like a hacker. Create vouchers, run reports, switch modes—all without touching the mouse. Your fingers will never leave the keyboard.',
                  gradient: 'from-yellow-400 to-orange-500',
                },
                {
                  icon: '🎨',
                  title: 'Dashboards That Slap',
                  description: 'Real-time charts that actually make sense. Sales trends, cash flow, GST liability—all visualized beautifully. Your managers will finally understand what\'s happening.',
                  gradient: 'from-pink-400 to-purple-500',
                },
                {
                  icon: '🧠',
                  title: 'Smart. Like, Really Smart.',
                  description: 'Auto-calculates GST, validates double-entry, tracks outstanding—automatically. It knows accounting better than your CA. Probably.',
                  gradient: 'from-blue-400 to-cyan-500',
                },
                {
                  icon: '🌙',
                  title: 'Dark Mode (Obviously)',
                  description: 'Because working at 2 AM shouldn\'t burn your retinas. Toggle themes instantly. Both modes are gorgeous. Choose your vibe.',
                  gradient: 'from-purple-400 to-indigo-500',
                },
                {
                  icon: '📊',
                  title: 'Excel on Steroids',
                  description: 'Export anything to Excel. Trial Balance, P&L, GST returns—one click. No formatting nightmares. Just clean, professional spreadsheets.',
                  gradient: 'from-green-400 to-emerald-500',
                },
                {
                  icon: '🇮🇳',
                  title: 'Built for India',
                  description: 'GST, TDS, compliance—everything. GSTR-3B ready. E-invoice ready. It just works. No "coming soon in next update" BS.',
                  gradient: 'from-orange-400 to-red-500',
                },
              ].map((feature, i) => (
                <Card key={i} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:scale-105 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                  <CardContent className="p-8">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            <Card className="mb-16 overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
                  <h3 className="text-3xl font-bold">The Brutal Truth</h3>
                  <p className="text-white/90 mt-2">How we stack up against the "competition"</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-gray-900 dark:text-white">Feature</th>
                        <th className="px-6 py-4 text-center text-gray-900 dark:text-white">Tally</th>
                        <th className="px-6 py-4 text-center text-gray-900 dark:text-white">Zoho Books</th>
                        <th className="px-6 py-4 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                          <span className="font-bold text-purple-600 dark:text-purple-400">Ledgo</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
                      {[
                        { feature: 'Keyboard Shortcuts', tally: '✅', zoho: '❌', us: '✅✅✅' },
                        { feature: 'Beautiful UI', tally: '❌', zoho: '⚠️', us: '✅' },
                        { feature: 'Dark Mode', tally: '❌', zoho: '❌', us: '✅' },
                        { feature: 'Real-time Dashboard', tally: '❌', zoho: '⚠️', us: '✅' },
                        { feature: 'Excel Export', tally: '⚠️', zoho: '✅', us: '✅' },
                        { feature: 'Open Source', tally: '❌', zoho: '❌', us: '✅' },
                        { feature: 'Free', tally: '❌ (₹54K)', zoho: '❌ ($$$)', us: '✅ (₹0)' },
                        { feature: 'Makes You Cool', tally: '❌', zoho: '❌', us: '✅✅✅' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 font-medium">{row.feature}</td>
                          <td className="px-6 py-4 text-center">{row.tally}</td>
                          <td className="px-6 py-4 text-center">{row.zoho}</td>
                          <td className="px-6 py-4 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 font-bold text-purple-600 dark:text-purple-400">
                            {row.us}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Final CTA */}
            <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
              <h3 className="text-4xl font-black mb-4">Ready to Experience the Future?</h3>
              <p className="text-xl mb-8 text-white/90">
                Join the accounting revolution. Your competitors are already using it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => {
                    if (currentUser) {
                      router.push(mode === 'manager' ? '/dashboard' : '/vouchers');
                    } else {
                      router.push('/login');
                    }
                  }}
                  className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold shadow-xl hover:scale-105 transition-all"
                >
                  {currentUser ? "🚀 Let's Go" : "🔐 Login to Join"}
                </Button>
                {currentUser && (
                  <Button
                    size="lg"
                    onClick={() => dispatch(toggleMode())}
                    className="text-lg px-8 py-6 bg-white/10 backdrop-blur text-white hover:bg-white/20 border-2 border-white/50 hover:scale-105 transition-all"
                  >
                    {mode === 'accountant' ? '📊 Switch to Manager Mode' : '⌨️ Switch to Accountant Mode'}
                  </Button>
                )}
              </div>
              <p className="mt-6 text-sm text-white/70">
                Press Alt+K anywhere to feel the power ⚡
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add animations to globals.css */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}