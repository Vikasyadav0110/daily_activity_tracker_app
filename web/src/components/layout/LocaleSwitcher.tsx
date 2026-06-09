'use client';

import { useI18n, Locale, LOCALE_LABELS } from '@/lib/i18n';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 px-3 pb-2">
      {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            locale === l
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
