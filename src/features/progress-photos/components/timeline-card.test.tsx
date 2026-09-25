import '@/core/i18n';

import { render, screen } from '@testing-library/react-native';

import type { TimelineSummary } from '../repositories/timelines.repository';
import { TimelineCard } from './timeline-card';

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('../hooks/use-photos', () => ({
  useCoverThumb: () => ({ status: 'success', data: null }),
}));

const base: TimelineSummary = {
  id: '1',
  title: 'Meu cabelo',
  templateKey: 'hair',
  color: '#8B5CF6',
  icon: 'hair',
  reminderIntervalDays: 14,
  reminderTime: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  entryCount: 0,
  lastEntryAt: null,
};

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

describe('TimelineCard', () => {
  it.each([
    [{ entryCount: 0, lastEntryAt: null }, 'Nenhum registro'],
    [{ entryCount: 1, lastEntryAt: new Date() }, '1 registro · Último registro hoje'],
    [{ entryCount: 5, lastEntryAt: daysAgo(1) }, '5 registros · Último registro há 1 dia'],
    [{ entryCount: 12, lastEntryAt: daysAgo(10) }, '12 registros · Último registro há 10 dias'],
  ])('summarizes %o', async (stats, expected) => {
    await render(<TimelineCard timeline={{ ...base, ...stats }} onPress={() => {}} />);
    expect(screen.getByText('Meu cabelo')).toBeOnTheScreen();
    expect(screen.getByText(expected)).toBeOnTheScreen();
  });
});
