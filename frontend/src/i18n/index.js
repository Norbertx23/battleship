import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import pl from './locales/pl.json';

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng?.startsWith('pl') ? 'pl' : 'en';
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, pl: { translation: pl } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl'],
    nonExplicitSupportedLngs: true,
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  });

export default i18n;
