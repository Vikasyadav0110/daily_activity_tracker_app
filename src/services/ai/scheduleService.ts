import { supabase } from '@services/supabase/client';
import { saveScheduledPlan, getActivePlan, type ScheduledPlan } from '@services/db/wellnessRepo';

export type { ScheduledPlan };

export interface ScheduleItem {
  time: string;
  activity: string;
  duration: number;
  category: string;
  note?: string;
}

export interface GeneratedSchedule {
  id: string;
  plan_name: string;
  schedule: ScheduleItem[];
  note: string;
  ai_generated: boolean;
}

export async function generateSchedule(
  goals: string[],
  availableHours: number,
  wakeTime = '06:00'
): Promise<GeneratedSchedule | null> {
  const { data, error } = await supabase.functions.invoke('generate-schedule', {
    body: { goals, available_hours: availableHours, wake_time: wakeTime, timezone: 'Asia/Kolkata' },
  });

  if (error || !data) return null;

  const result = data as { schedule: ScheduleItem[]; note: string; ai_generated: boolean };
  const id = Math.random().toString(36).slice(2);
  const today = new Date().toISOString().split('T')[0];
  const planName = `${result.ai_generated ? 'AI' : 'Template'} Plan — ${today}`;

  await saveScheduledPlan(id, planName, result.schedule, today, 'ai_generated');

  return { id, plan_name: planName, schedule: result.schedule, note: result.note, ai_generated: result.ai_generated };
}

export async function getCurrentPlan(): Promise<{ plan: ScheduledPlan; schedule: ScheduleItem[] } | null> {
  const plan = await getActivePlan();
  if (!plan) return null;
  try {
    const schedule = JSON.parse(plan.plan_json) as ScheduleItem[];
    return { plan, schedule };
  } catch {
    return null;
  }
}
