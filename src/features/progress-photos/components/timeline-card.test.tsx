import '@/core/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

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
    [{ entryCount: 0, lastEntryAt: null }, ['Nenhum registro']],
    [{ entryCount: 1, lastEntryAt: new Date() }, ['1 registro', 'Hoje']],
    [{ entryCount: 5, lastEntryAt: daysAgo(1) }, ['5 registros', 'Há 1 dia']],
    [{ entryCount: 12, lastEntryAt: daysAgo(10) }, ['12 registros', 'Há 10 dias']],
  ])('summarizes %o', async (stats, tags) => {
    await render(
      <TimelineCard timeline={{ ...base, ...stats }} onPress={() => {}} onNewEntry={() => {}} />,
    );
    expect(screen.getByText('Meu cabelo')).toBeOnTheScreen();
    for (const tag of tags) expect(screen.getByText(tag)).toBeOnTheScreen();
  });

  it('starts a new entry from the round button', async () => {
    const onNewEntry = jest.fn();
    const onPress = jest.fn();
    await render(<TimelineCard timeline={base} onPress={onPress} onNewEntry={onNewEntry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Novo registro' }));
    expect(onNewEntry).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
