'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

const NAV = [
  { href: '/dashboard',            icon: '🏠', label: 'Today' },
  { href: '/dashboard/activities', icon: '✅', label: 'Activities' },
  { href: '/dashboard/analytics',  icon: '📊', label: 'Analytics' },
  { href: '/dashboard/wellness',   icon: '💚', label: 'Wellness' },
  { href: '/dashboard/social',     icon: '🏆', label: 'Social' },
  { href: '/dashboard/coaching',       icon: '🤖', label: 'Coaching' },
  { href: '/dashboard/api-keys',      icon: '🔑', label: 'API Keys' },
  { href: '/dashboard/developers',    icon: '🛠️', label: 'Developers' },
  { href: '/dashboard/integrations',  icon: '🔗', label: 'Integrations' },
  { href: '/dashboard/marketplace',   icon: '🛒', label: 'Marketplace' },
  { href: '/dashboard/enterprise',    icon: '🏢', label: 'Enterprise' },
  { href: '/dashboard/growth',         icon: '📈', label: 'Growth' },
  { href: '/dashboard/settings',      icon: '⚙️', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Daily Tracker</p>
          <p className="text-xs text-gray-400 mt-0.5">Web App</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Locale switcher */}
      <LocaleSwitcher />

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
