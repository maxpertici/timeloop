import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Detect system language
const getSystemLanguage = (): string => {
  // Get browser/system language
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Extract language code (e.g., 'fr' from 'fr-FR')
  const langCode = browserLang.split('-')[0];
  
  // Check if we support this language, otherwise fallback to English
  const supportedLanguages = ['en', 'fr'];
  return supportedLanguages.includes(langCode) ? langCode : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
