import { Pressable, View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { PressableCard, Text } from '@/shared/ui';

import type { Entry, MetricDefinition, Photo, TimelineAngle } from '../db/progress-photos.schema';
import { formatDecimal } from '../lib/metrics';
import { PhotoThumb } from './photo-thumb';

type EntryCardProps = {
  entry: Entry;
  /** Days since the first entry (0 = first). */
  dayNumber: number;
  photos: Photo[];
  angles: TimelineAngle[];
  metrics: MetricDefinition[];
  values: Map<string, number> | undefined;
  onPress: () => void;
  onPhotoPress: (photo: Photo) => void;
};

export function EntryCard({
  entry,
  dayNumber,
  photos,
  angles,
  metrics,
  values,
  onPress,
  onPhotoPress,
}: EntryCardProps) {
  const { t } = useTranslation('photos');
  const angleOrder = new Map(angles.map((a, i) => [a.id, i]));
  const sorted = [...photos].sort(
    (a, b) => (angleOrder.get(a.angleId) ?? 99) - (angleOrder.get(b.angleId) ?? 99),
  );
  const labelOf = (angleId: string) => angles.find((a) => a.id === angleId)?.label ?? '';
  const metricText = metrics
    .filter((m) => values?.has(m.id))
    .map((m) => `${m.label} ${formatDecimal(values!.get(m.id)!, i18n.language)} ${m.unit}`)
    .join(' · ');

  return (
    <PressableCard onPress={onPress} className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text variant="subtitle">
          {entry.takenAt.toLocaleDateString(i18n.language, { dateStyle: 'medium' })}
        </Text>
        <Text variant="caption">{t('feed.day', { n: dayNumber + 1 })}</Text>
      </View>

      {sorted.length ? (
        <View className="flex-row flex-wrap gap-2">
          {sorted.map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('feed.openPhoto', { angle: labelOf(photo.angleId) })}
              onPress={() => onPhotoPress(photo)}>
              <PhotoThumb thumbFileName={photo.thumbFileName} size={72} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text variant="caption">{t('feed.noPhotosForAngle')}</Text>
      )}

      {metricText ? <Text variant="caption">{metricText}</Text> : null}
      {entry.note ? (
        <Text className="text-sm" numberOfLines={2}>
          {entry.note}
        </Text>
      ) : null}
    </PressableCard>
  );
}
