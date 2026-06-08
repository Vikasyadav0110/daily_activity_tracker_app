export interface Category {
  key: string;
  icon: string;
  labelKey: string; // i18n key: activities.categories.<key>
}

export const CATEGORIES: Category[] = [
  { key: 'fitness',      icon: '💪', labelKey: 'activities.categories.fitness' },
  { key: 'study',        icon: '📚', labelKey: 'activities.categories.study' },
  { key: 'spiritual',    icon: '🕉️', labelKey: 'activities.categories.spiritual' },
  { key: 'health',       icon: '🏥', labelKey: 'activities.categories.health' },
  { key: 'productivity', icon: '📊', labelKey: 'activities.categories.productivity' },
  { key: 'custom',       icon: '⚡', labelKey: 'activities.categories.custom' },
];

export const ACTIVITY_EMOJIS = [
  '🏃', '💪', '🧘', '🏊', '🚴', '⚽', '🏋️', '🤸', '🧗', '🏄',
  '📚', '✏️', '🎓', '📝', '🔬', '🧪', '📐', '💻', '🖊️', '📖',
  '🕉️', '🙏', '🧿', '☯️', '🪷', '🕯️', '📿', '🌿', '🌸', '✨',
  '💊', '🥗', '💧', '🥦', '🍎', '🫁', '❤️', '🩺', '🧬', '🫀',
  '⏰', '🗓️', '✅', '🎯', '🔔', '📱', '💼', '🗂️', '📋', '🎪',
  '🌅', '🛏️', '🚿', '🪥', '☕', '🍵', '🎵', '🎸', '🎨', '✍️',
];

export const DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];
