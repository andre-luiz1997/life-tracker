import en from './locales/en/common.json';
import ptBR from './locales/pt-BR/common.json';

import { detectLanguage, i18n } from '.';

function keysOf(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it('has the same keys in every locale', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(ptBR).sort());
  });

  it('defaults to pt-BR', () => {
    expect(detectLanguage()).toBe('pt-BR');
    expect(i18n.t('tabs.home')).toBe('Início');
  });
});
