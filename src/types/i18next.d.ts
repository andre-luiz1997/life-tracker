import 'i18next';

import type ptBRCommon from '@/core/i18n/locales/pt-BR/common.json';
import type ptBRPhotos from '@/core/i18n/locales/pt-BR/photos.json';
import type ptBRSecurity from '@/core/i18n/locales/pt-BR/security.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof ptBRCommon;
      photos: typeof ptBRPhotos;
      security: typeof ptBRSecurity;
    };
  }
}
