import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import bn from './locales/bn.json';

const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn'];

function getDeviceLanguage(): string {
  const locale = Localization.getLocales()?.[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(locale) ? locale : 'en';
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te },
    bn: { translation: bn },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  returnEmptyString: false,
});

export default i18n;
export { SUPPORTED_LANGUAGES };
