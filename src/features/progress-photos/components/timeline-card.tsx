import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { IconButton, PressableCard, Tag, Text } from '@/shared/ui';

import { useCoverThumb } from '../hooks/use-photos';
import { daysBetween } from '../lib/dates';
import type { TimelineSummary } from '../repositories/timelines.repository';
import { PhotoThumb } from './photo-thumb';
import { TimelineIcon } from './timeline-icon';

type TimelineCardProps = {
  timeline: TimelineSummary;
  onPress: () => void;
  /** Round shortcut button: start a new entry right from the list. */
  onNewEntry: () => void;
};

/** White card; the timeline's pastel color goes on its icon, tags and round action button. */
export function TimelineCard({ timeline, onPress, onNewEntry }: TimelineCardProps) {
  const { t } = useTranslation('photos');
  const cover = useCoverThumb(timeline.id);
  // Soft tint of the timeline color for the tags (hex + alpha).
  const tint = `${timeline.color}66`;

  const days = timeline.lastEntryAt ? daysBetween(timeline.lastEntryAt, new Date()) : null;
  const lastEntry =
    days === null
      ? null
      : days === 0
        ? t('home.lastEntryToday')
        : t('home.lastEntryDays', { count: days });

  return (
    <PressableCard onPress={onPress} className="gap-4">
      <View className="flex-row items-center gap-4">
        {cover.data ? (
          <PhotoThumb thumbFileName={cover.data} size={56} />
        ) : (
          <TimelineIcon icon={timeline.icon} color={timeline.color} size={56} />
        )}
        <View className="flex-1 gap-0.5">
          <Text variant="subtitle" numberOfLines={2}>
            {timeline.title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {t(`templates.${timeline.templateKey}.name`)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row flex-wrap gap-2">
          <Tag color={tint} label={t('home.entries', { count: timeline.entryCount })} />
          {lastEntry ? <Tag color={tint} label={lastEntry} /> : null}
        </View>
        <IconButton
          icon="camera"
          color="on-accent"
          size={20}
          diameter={48}
          style={{ backgroundColor: timeline.color }}
          accessibilityLabel={t('timeline.newEntry')}
          onPress={onNewEntry}
        />
      </View>
    </PressableCard>
  );
}
