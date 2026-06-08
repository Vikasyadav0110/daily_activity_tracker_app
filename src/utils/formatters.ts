export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatStudyHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

export function formatScore(score: number, total: number): string {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return `${score}/${total} (${pct}%)`;
}

export function formatStreakDays(days: number, language = 'en'): string {
  if (language === 'hi') return `${days} दिन`;
  if (language === 'ta') return `${days} நாட்கள்`;
  if (language === 'te') return `${days} రోజులు`;
  if (language === 'bn') return `${days} দিন`;
  return days === 1 ? `${days} day` : `${days} days`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
