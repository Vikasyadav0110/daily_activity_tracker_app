import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllStreaks } from '@services/db/streaksRepo';
import { getActivities } from '@services/db/activitiesRepo';
import { getSettings } from '@services/db/settingsRepo';
import { isStreakAtRisk, isStreakBroken } from '@utils/streakCalculator';
import { getTodayIST } from '@utils/dateUtils';

// Notification IDs — stable so rescheduling replaces, not duplicates
const NOTIF_MORNING = 'morning-checkin';
const NOTIF_EVENING = 'evening-checkin';
const NOTIF_STREAK_PREFIX = 'streak-risk-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyCheckIns(): Promise<void> {
  const settings = await getSettings();
  if (!settings.notification_enabled) return;

  // Cancel any previously scheduled check-ins before rescheduling
  await Notifications.cancelScheduledNotificationAsync(NOTIF_MORNING).catch(() => null);
  await Notifications.cancelScheduledNotificationAsync(NOTIF_EVENING).catch(() => null);

  const lang = settings.language ?? 'en';

  const morningTitle = TITLES.morning[lang] ?? TITLES.morning.en;
  const morningBody = BODIES.morning[lang] ?? BODIES.morning.en;
  const eveningTitle = TITLES.evening[lang] ?? TITLES.evening.en;
  const eveningBody = BODIES.evening[lang] ?? BODIES.evening.en;

  // 8:00 AM daily
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_MORNING,
    content: { title: morningTitle, body: morningBody, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  // 8:00 PM daily
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_EVENING,
    content: { title: eveningTitle, body: eveningBody, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function scheduleStreakAtRiskNotifications(): Promise<void> {
  const settings = await getSettings();
  if (!settings.notification_enabled) return;

  const [streaks, activities] = await Promise.all([
    getAllStreaks(),
    getActivities({ archived: false }),
  ]);

  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const today = getTodayIST();
  const lang = settings.language ?? 'en';

  for (const streak of streaks) {
    const activity = activityMap.get(streak.activity_id);
    if (!activity) continue;

    const notifId = `${NOTIF_STREAK_PREFIX}${streak.activity_id}`;

    // Cancel stale notification first
    await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => null);

    if (streak.current_streak_days === 0) continue;

    if (isStreakBroken(streak, today)) continue;

    if (!isStreakAtRisk(streak, today)) continue;

    // Streak is at risk — schedule a 9 PM reminder tonight
    const isForgiveness = streak.forgiveness_used === false &&
      streak.last_logged_date !== today;

    const titleKey = isForgiveness ? 'forgiveness' : 'streak_at_risk';
    const title = TITLES[titleKey]?.[lang] ?? TITLES[titleKey]?.en ?? '';
    const body = (BODIES[titleKey]?.[lang] ?? BODIES[titleKey]?.en ?? '')
      .replace('{{name}}', activity.name)
      .replace('{{days}}', String(streak.current_streak_days));

    const now = new Date();
    const trigger = new Date(now);
    trigger.setHours(21, 0, 0, 0);

    // Only schedule if it's still in the future today
    if (trigger > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: { title, body, sound: true, data: { activityId: streak.activity_id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
    }
  }
}

export async function scheduleActivityReminder(
  activityId: number,
  activityName: string,
  hour: number,
  minute: number,
): Promise<void> {
  const settings = await getSettings();
  const lang = settings.language ?? 'en';
  const title = TITLES.reminder[lang] ?? TITLES.reminder.en;
  const body = (BODIES.reminder[lang] ?? BODIES.reminder.en)
    .replace('{{name}}', activityName);

  await Notifications.scheduleNotificationAsync({
    identifier: `reminder-${activityId}`,
    content: { title, body, sound: true, data: { activityId } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelActivityReminder(activityId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`reminder-${activityId}`).catch(() => null);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── i18n strings (inline to avoid circular imports) ──────────────────────────

type LangMap = Record<string, string>;

const TITLES: Record<string, LangMap> = {
  morning: {
    en: 'Good morning! ☀️',
    hi: 'सुप्रभात! ☀️',
    ta: 'காலை வணக்கம்! ☀️',
    te: 'శుభోదయం! ☀️',
    bn: 'শুভ সকাল! ☀️',
  },
  evening: {
    en: 'Evening check-in 🌙',
    hi: 'शाम की जांच 🌙',
    ta: 'மாலை சரிபார்ப்பு 🌙',
    te: 'సాయంత్రం తనిఖీ 🌙',
    bn: 'সন্ধ্যা চেক-ইন 🌙',
  },
  streak_at_risk: {
    en: '🔥 Streak at risk!',
    hi: '🔥 स्ट्रीक खतरे में!',
    ta: '🔥 தொடர்ச்சி ஆபத்தில்!',
    te: '🔥 స్ట్రీక్ ప్రమాదంలో!',
    bn: '🔥 স্ট্রিক ঝুঁকিতে!',
  },
  forgiveness: {
    en: '⏳ 48-hour grace period active',
    hi: '⏳ 48 घंटे की माफी सक्रिय है',
    ta: '⏳ 48 மணி நேர அருள் காலம்',
    te: '⏳ 48 గంటల క్షమాకాలం',
    bn: '⏳ 48 ঘণ্টার ছাড় সক্রিয়',
  },
  reminder: {
    en: "Don't forget! 🔔",
    hi: 'मत भूलिए! 🔔',
    ta: 'மறக்காதீர்கள்! 🔔',
    te: 'మర్చిపోకండి! 🔔',
    bn: 'ভুলবেন না! 🔔',
  },
};

const BODIES: Record<string, LangMap> = {
  morning: {
    en: "Time to check off today's activities.",
    hi: 'आज की गतिविधियाँ चेक करने का समय।',
    ta: 'இன்றைய நடவடிக்கைகளை சரிபார்க்கும் நேரம்.',
    te: 'ఈరోజు కార్యకలాపాలు చెక్ చేసే సమయం.',
    bn: 'আজকের কার্যকলাপ চেক করার সময়।',
  },
  evening: {
    en: "How was your day? Log your activities.",
    hi: 'आपका दिन कैसा रहा? गतिविधियाँ लॉग करें।',
    ta: 'உங்கள் நாள் எப்படி இருந்தது? நடவடிக்கைகளை பதிவு செய்யுங்கள்.',
    te: 'మీ రోజు ఎలా గడిచింది? కార్యకలాపాలు లాగ్ చేయండి.',
    bn: 'আপনার দিন কেমন ছিল? কার্যকলাপ লগ করুন।',
  },
  streak_at_risk: {
    en: 'Log {{name}} before midnight to keep your {{days}}-day streak! 💪',
    hi: 'अपनी {{days}} दिन की स्ट्रीक बचाने के लिए आधी रात से पहले {{name}} लॉग करें! 💪',
    ta: '{{days}} நாள் தொடர்ச்சியை காக்க நள்ளிரவுக்கு முன் {{name}} பதிவு செய்யுங்கள்! 💪',
    te: '{{days}} రోజుల స్ట్రీక్ కాపాడుకోవడానికి అర్ధరాత్రికి ముందు {{name}} లాగ్ చేయండి! 💪',
    bn: '{{days}} দিনের স্ট্রিক বাঁচাতে মধ্যরাতের আগে {{name}} লগ করুন! 💪',
  },
  forgiveness: {
    en: 'Log {{name}} today to save your {{days}}-day streak! Last chance.',
    hi: 'अपनी {{days}} दिन की स्ट्रीक बचाने के लिए आज {{name}} लॉग करें! अंतिम मौका।',
    ta: '{{days}} நாள் தொடர்ச்சியை காக்க இன்று {{name}} பதிவு செய்யுங்கள்! கடைசி வாய்ப்பு.',
    te: '{{days}} రోజుల స్ట్రీక్ కాపాడుకోవడానికి ఈరోజు {{name}} లాగ్ చేయండి! చివరి అవకాశం.',
    bn: '{{days}} দিনের স্ট্রিক বাঁচাতে আজ {{name}} লগ করুন! শেষ সুযোগ।',
  },
  reminder: {
    en: "You haven't logged {{name}} yet today.",
    hi: 'आपने आज अभी तक {{name}} लॉग नहीं किया।',
    ta: 'இன்று இன்னும் {{name}} பதிவு செய்யவில்லை.',
    te: 'ఈరోజు ఇంకా {{name}} లాగ్ చేయలేదు.',
    bn: 'আজ এখনও {{name}} লগ করেননি।',
  },
};

// Android notification channel (required for Android 8+)
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Activity Tracker',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1565C0',
    });
  }
}
