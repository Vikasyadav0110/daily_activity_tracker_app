import { create } from 'zustand';
import i18n from '@i18n/index';
import { updateSettings } from '@services/db/settingsRepo';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark';
  notificationEnabled: boolean;
  onboardingComplete: boolean;
  settingsLoaded: boolean;
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  loadFromDB: (settings: {
    language: string;
    theme: 'light' | 'dark';
    notification_enabled: boolean;
    onboarding_complete: boolean;
  }) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  theme: 'light',
  notificationEnabled: true,
  onboardingComplete: false,
  settingsLoaded: false,

  setLanguage: (lang) => {
    set({ language: lang });
    i18n.changeLanguage(lang);
    updateSettings({ language: lang }).catch(() => null);
  },

  setTheme: (theme) => {
    set({ theme });
    updateSettings({ theme }).catch(() => null);
  },

  setNotificationEnabled: (enabled) => {
    set({ notificationEnabled: enabled });
    updateSettings({ notification_enabled: enabled }).catch(() => null);
  },

  setOnboardingComplete: (complete) => {
    set({ onboardingComplete: complete });
    updateSettings({ onboarding_complete: complete }).catch(() => null);
  },

  loadFromDB: (settings) => {
    set({
      language: settings.language,
      theme: settings.theme,
      notificationEnabled: settings.notification_enabled,
      onboardingComplete: settings.onboarding_complete,
      settingsLoaded: true,
    });
    i18n.changeLanguage(settings.language);
  },
}));
