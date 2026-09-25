import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Icon, PressableCard, Text } from '@/shared/ui';

import { useCoverThumb } from '../hooks/use-photos';
import { daysBetween } from '../lib/dates';
import type { TimelineSummary } from '../repositories/timelines.repository';
import { PhotoThumb } from './photo-thumb';
import { TimelineIcon } from './timeline-icon';

type TimelineCardProps = { timeline: TimelineSummary; onPress: () => void };

export function TimelineCard({ timeline, onPress }: TimelineCardProps) {
  const { t } = useTranslation('photos');
  const scheme = useAppColorScheme();
  const cover = useCoverThumb(timeline.id);

  const days = timeline.lastEntryAt ? daysBetween(timeline.lastEntryAt, new Date()) : null;
  const lastEntry =
    days === null
      ? null
      : days === 0
        ? t('home.lastEntryToday')
        : t('home.lastEntryDays', { count: days });

  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-4">
      {cover.data ? (
        <PhotoThumb thumbFileName={cover.data} size={44} />
      ) : (
        <TimelineIcon icon={timeline.icon} color={timeline.color} />
      )}
      <View className="flex-1 gap-0.5">
        <Text variant="subtitle" numberOfLines={1}>
          {timeline.title}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {[t('home.entries', { count: timeline.entryCount }), lastEntry]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={colorOf(scheme, 'muted')} />
    </PressableCard>
  );
}
