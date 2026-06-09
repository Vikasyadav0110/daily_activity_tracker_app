import { Share } from 'react-native';
import { getAllStreaks } from '@services/db/streaksRepo';
import { getActivities } from '@services/db/activitiesRepo';
import { getLevelInfo } from '@services/xp/xpEngine';

const APP_TAGLINE = 'Track habits. Build streaks. Stay consistent.';

export async function shareStreakCard(totalXp: number, weekXp: number): Promise<void> {
  const [activities, streaks] = await Promise.all([
    getActivities({ archived: false }),
    getAllStreaks(),
  ]);

  const activityMap = new Map(activities.map((a) => [a.id, a]));

  // Top 3 streaks with active days
  const ranked = streaks
    .filter((s) => s.current_streak_days > 0)
    .sort((a, b) => b.current_streak_days - a.current_streak_days)
    .slice(0, 3);

  const { current } = getLevelInfo(totalXp);
  const streakLines = ranked
    .map((s) => {
      const activity = activityMap.get(s.activity_id);
      if (!activity) return '';
      return `${activity.icon} ${activity.name} — ${s.current_streak_days} days 🔥`;
    })
    .filter(Boolean)
    .join('\n');

  const noStreaks = ranked.length === 0;

  const card = [
    `${current.icon} *Level ${current.level}: ${current.name}* ${current.icon}`,
    '',
    noStreaks
      ? "Just started my journey! 🌱"
      : `My active streaks:\n${streakLines}`,
    '',
    `⚡ ${weekXp} XP this week · ${totalXp} XP total`,
    '',
    APP_TAGLINE,
    '#DailyTracker #HabitStreak #BuildConsistency',
  ].join('\n');

  await Share.share({
    message: card,
    title: 'My Habit Streak',
  });
}

export async function shareMilestone(
  activityName: string,
  activityIcon: string,
  streakDays: number
): Promise<void> {
  const milestoneEmoji =
    streakDays >= 100 ? '👑' :
    streakDays >= 30  ? '🏆' :
    streakDays >= 7   ? '🔥' : '✨';

  const message = [
    `${milestoneEmoji} ${streakDays}-day streak milestone! ${milestoneEmoji}`,
    '',
    `${activityIcon} *${activityName}* — ${streakDays} days without missing a beat!`,
    '',
    APP_TAGLINE,
    '#DailyTracker #HabitStreak',
  ].join('\n');

  await Share.share({ message, title: `${streakDays}-Day Streak!` });
}
