import type { ReactNode } from 'react';
import Link from 'next/link';
import { ConsentBanner } from '@/components/gdpr/ConsentBanner';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-lg tracking-tight">Daily Activity Tracker</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
            <Link href="/sign-in" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900">Sign In</Link>
            <Link href="/sign-up"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      {children}
      <ConsentBanner />
      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <p className="font-semibold mb-3">Product</p>
            <ul className="space-y-2 text-gray-500 dark:text-gray-400">
              <li><Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-gray-500 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-gray-900 dark:hover:text-white">About</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">Legal</p>
            <ul className="space-y-2 text-gray-500 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">Download</p>
            <ul className="space-y-2 text-gray-500 dark:text-gray-400">
              <li><span>App Store</span></li>
              <li><span>Google Play</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Daily Activity Tracker. All rights reserved.</p>
          <p>Available in 11 languages · 8 regions</p>
        </div>
      </footer>
    </div>
  );
}
