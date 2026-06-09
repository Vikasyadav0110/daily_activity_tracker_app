import { createClient } from '@/lib/supabase/server';

export async function TopBar({ title }: { title: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">{displayName}</span>
      </div>
    </header>
  );
}
