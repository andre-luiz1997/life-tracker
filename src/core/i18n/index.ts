import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import ptBRCommon from './locales/pt-BR/common.json';

export const resources = {
  'pt-BR': { common: ptBRCommon },
  en: { common: enCommon },
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
  ns: ['common'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
export { useTranslation } from 'react-i18next';
