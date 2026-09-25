import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enPhotos from './locales/en/photos.json';
import enSecurity from './locales/en/security.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRPhotos from './locales/pt-BR/photos.json';
import ptBRSecurity from './locales/pt-BR/security.json';

export const resources = {
  'pt-BR': { common: ptBRCommon, photos: ptBRPhotos, security: ptBRSecurity },
  en: { common: enCommon, photos: enPhotos, security: enSecurity },
} as const;

export type AppLanguage = keyof typeof resources;
export const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR';

export function detectLanguage(): AppLanguage {
  for (const { languageTag, languageCode } of getLocales()) {
    if (languageTag in resources) return languageTag as AppLanguage;
    if (languageCode === 'pt') return 'pt-BR';
    if (languageCode === 'en') return 'en';
  }
  return DEFAULT_LANGUAGE;
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: ['common', 'photos', 'security'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
export { useTranslation } from 'react-i18next';
