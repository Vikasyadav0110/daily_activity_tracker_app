'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Activity, ActivityLog } from '@/lib/types';

interface Props {
  activities: Activity[];
  logs: ActivityLog[];
  today: string;
  userId: string;
}

export function TodayActivityList({ activities, logs, today, userId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [logging, setLogging] = useState<number | null>(null);

  const logMap = new Map(logs.map((l) => [l.activity_id, l]));

  async function handleToggle(activity: Activity) {
    setLogging(activity.id);
    const existing = logMap.get(activity.id);
    try {
      if (existing && existing.count > 0) {
        // Un-log
        await supabase
          .from('activity_logs')
          .update({ count: 0 })
          .eq('id', existing.id);
      } else if (existing) {
        await supabase
          .from('activity_logs')
          .update({ count: activity.target_count })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('activity_logs')
          .insert({ user_id: userId, activity_id: activity.id, log_date: today, count: activity.target_count });
      }
      router.refresh();
    } finally {
      setLogging(null);
    }
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const log = logMap.get(activity.id);
        const done = (log?.count ?? 0) > 0;
        const isLogging = logging === activity.id;
        return (
          <div
            key={activity.id}
            className={`flex items-center gap-4 bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${
              done
                ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-100 dark:border-gray-800'
            }`}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: activity.color + '20' }}
            >
              {activity.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {activity.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Target: {activity.target_count} {activity.unit} · {activity.frequency}
              </p>
            </div>

            {/* Done badge */}
            {done && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg flex-shrink-0">
                ✓ Done
              </span>
            )}

            {/* Toggle button */}
            <button
              onClick={() => handleToggle(activity)}
              disabled={isLogging}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                done
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              {isLogging ? (
                <svg className="animate-spin w-4 h-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : done ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
