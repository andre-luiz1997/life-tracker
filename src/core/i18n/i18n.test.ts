import enCommon from './locales/en/common.json';
import enPhotos from './locales/en/photos.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRPhotos from './locales/pt-BR/photos.json';

import { detectLanguage, i18n } from '.';

function keysOf(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  // Plural suffixes differ per language, so compare the base keys.
  const base = (obj: object) =>
    [...new Set(keysOf(obj).map((k) => k.replace(/_(zero|one|few|many|other)$/, '')))].sort();

  it.each([
    ['common', enCommon, ptBRCommon],
    ['photos', enPhotos, ptBRPhotos],
  ])('has the same %s keys in every locale', (_, en, ptBR) => {
    expect(base(en)).toEqual(base(ptBR));
  });

  it('defaults to pt-BR', () => {
    expect(detectLanguage()).toBe('pt-BR');
    expect(i18n.t('tabs.home')).toBe('Início');
  });
});
