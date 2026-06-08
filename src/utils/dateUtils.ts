import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getTodayIST(): string {
  const now = new Date();
  const ist = toZonedTime(now, IST_TIMEZONE);
  return format(ist, 'yyyy-MM-dd');
}

export function getNowIST(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

export function formatDateISO(date: Date): string {
  const ist = toZonedTime(date, IST_TIMEZONE);
  return format(ist, 'yyyy-MM-dd');
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = parseISO(dateA);
  const b = parseISO(dateB);
  if (!isValid(a) || !isValid(b)) return 0;
  return Math.abs(differenceInDays(b, a));
}

export function isWithin48Hours(lastDate: string, today: string): boolean {
  return daysBetween(lastDate, today) <= 1;
}

export function getYesterdayIST(): string {
  const now = getNowIST();
  now.setDate(now.getDate() - 1);
  return format(now, 'yyyy-MM-dd');
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
}

export function getDayOfWeek(dateStr: string): number {
  // Returns 0=Sun, 1=Mon, ..., 6=Sat
  const d = parseISO(dateStr);
  if (!isValid(d)) return 0;
  return d.getDay();
}

export function getDayOfWeekName(dateStr: string): string {
  const idx = getDayOfWeek(dateStr);
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][idx];
}

export function getDateRangeIST(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function isScheduledForDate(frequency: string, date: string): boolean {
  if (frequency === 'daily') return true;

  if (frequency.startsWith('weekly:')) {
    const dayIndices = frequency
      .replace('weekly:', '')
      .split(',')
      .map(Number);
    return dayIndices.includes(getDayOfWeek(date));
  }

  if (frequency.startsWith('monthly:')) {
    const dayNums = frequency
      .replace('monthly:', '')
      .split(',')
      .map(Number);
    const d = parseISO(date);
    return dayNums.includes(d.getDate());
  }

  return true;
}

export function getGreeting(): 'morning' | 'afternoon' | 'evening' {
  const hour = getNowIST().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function formatDisplayDate(dateStr: string): string {
  const today = getTodayIST();
  const yesterday = getYesterdayIST();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = parseISO(dateStr);
  return format(d, 'dd MMM yyyy');
}
