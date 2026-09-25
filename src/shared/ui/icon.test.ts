import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { icons } from './icon';

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-symbols/androidWeights/regular', () => ({ name: 'MaterialSymbols', font: 1 }));

// Read the library's own name → codepoint table (not exported, so read the file directly).
const symbols: Record<string, number> = JSON.parse(
  readFileSync(
    join(__dirname, '../../../node_modules/expo-symbols/build/android/symbols.json'),
    'utf8',
  ),
);

describe('icons', () => {
  it.each(Object.entries(icons))('%s has the Material Symbols codepoint', (_, icon) => {
    expect(icon.codepoint).toBe(symbols[icon.android]);
  });
});
