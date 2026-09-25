import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { i18n, useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Button, Card, Chip, EmptyState, Slider, Text } from '@/shared/ui';

import { PhotoThumb } from '../components/photo-thumb';
import type { Photo } from '../db/progress-photos.schema';
import { clearDecryptedPhotos, useFullPhoto } from '../hooks/use-photo-source';
import { useAnglePhotos, useTimelineFeed } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { daysBetween } from '../lib/dates';
import { formatChange } from '../lib/metrics';
import { type CompareMode, defaultPair, metricDiffs } from './compare';
import { shareComparison } from './export-comparison';

type Row = { photo: Photo; takenAt: Date };
const MODES: CompareMode[] = ['side', 'slider', 'overlay'];

export function CompareScreen({
  timelineId,
  angleId: initialAngle,
}: {
  timelineId: string;
  angleId?: string;
}) {
  const { t } = useTranslation('photos');
  const details = useTimelineDetails(timelineId);
  const [angleId, setAngleId] = useState(initialAngle);

  useEffect(() => () => clearDecryptedPhotos(), []);

  if (details.status === 'loading') return null;
  if (!details.data) return <EmptyState title={t('timeline.notFound')} />;
  const angles = details.data.angles.filter((a) => a.isActive);
  const current = angleId ?? angles[0]?.id;

  return (
    <>
      <Stack.Screen options={{ title: t('compare.title') }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2">
          {angles.map((angle) => (
            <Chip
              key={angle.id}
              label={angle.label}
              selected={angle.id === current}
              onPress={() => setAngleId(angle.id)}
            />
          ))}
        </ScrollView>
        {current ? (
          <AngleComparison key={current} timelineId={timelineId} angleId={current} />
        ) : null}
      </ScrollView>
    </>
  );
}

function AngleComparison({ timelineId, angleId }: { timelineId: string; angleId: string }) {
  const { t } = useTranslation('photos');
  const photos = useAnglePhotos(angleId);
  const feed = useTimelineFeed(timelineId);
  const details = useTimelineDetails(timelineId);
  const [pair, setPair] = useState<[string, string] | null>(null);
  const [mode, setMode] = useState<CompareMode>('side');
  const [sharing, setSharing] = useState(false);

  if (photos.status !== 'success' || !feed.data || !details.data) return null;
  const list = photos.data;
  const [beforeId, afterId] = pair ?? defaultPair(list) ?? [];
  const before = list.find((r) => r.photo.id === beforeId);
  const after = list.find((r) => r.photo.id === afterId);
  if (!before || !after) return <EmptyState title={t('compare.needTwo')} />;

  const locale = i18n.language;
  const first = list[0]!;
  const caption = (r: Row) =>
    `${r.takenAt.toLocaleDateString(locale, { dateStyle: 'medium' })} · ${t('feed.day', {
      n: daysBetween(first.takenAt, r.takenAt) + 1,
    })}`;
  const apart = Math.abs(daysBetween(before.takenAt, after.takenAt));
  const diffs = metricDiffs(
    details.data.metrics,
    feed.data.valuesByEntry.get(before.photo.entryId),
    feed.data.valuesByEntry.get(after.photo.entryId),
  );

  const share = async () => {
    setSharing(true);
    try {
      await shareComparison(
        { fileName: before.photo.fileName, caption: caption(before) },
        { fileName: after.photo.fileName, caption: caption(after) },
        t('compare.shareTitle'),
      );
    } catch (error) {
      if (__DEV__) console.error(error);
      Alert.alert(t('compare.shareError'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="flex-row gap-2">
        {MODES.map((m) => (
          <Chip
            key={m}
            label={t(`compare.modes.${m}`)}
            selected={mode === m}
            onPress={() => setMode(m)}
          />
        ))}
      </View>

      <ComparisonView mode={mode} before={before} after={after} />

      <View className="flex-row justify-between">
        <Text variant="caption">{caption(before)}</Text>
        <Text variant="caption">{caption(after)}</Text>
      </View>
      <Text className="text-center font-body-semibold">
        {apart === 0 ? t('compare.sameDay') : t('compare.daysApart', { count: apart })}
      </Text>

      {diffs.length ? (
        <Card className="gap-2">
          {diffs.map((d) => (
            <View key={d.metric.id} className="flex-row justify-between">
              <Text>{d.metric.label}</Text>
              <Text className="font-body-semibold">
                {formatChange(d.change, d.metric.unit, locale)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <PhotoStrip
        label={t('compare.before')}
        list={list}
        selected={before.photo.id}
        onSelect={(id) => setPair([id, after.photo.id])}
      />
      <PhotoStrip
        label={t('compare.after')}
        list={list}
        selected={after.photo.id}
        onSelect={(id) => setPair([before.photo.id, id])}
      />

      <Button variant="secondary" label={t('compare.share')} onPress={share} loading={sharing} />
    </View>
  );
}

function ComparisonView({ mode, before, after }: { mode: CompareMode; before: Row; after: Row }) {
  const { t } = useTranslation('photos');
  const beforeUri = useFullPhoto(before.photo.fileName);
  const afterUri = useFullPhoto(after.photo.fileName);
  const [width, setWidth] = useState(0);
  const [divider, setDivider] = useState(0.5);
  const [opacity, setOpacity] = useState(0.5);

  // Frame follows the "before" photo's aspect ratio.
  const aspect = before.photo.width / before.photo.height;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const dividerGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => width && setDivider(Math.min(1, Math.max(0, e.x / width))))
    .onUpdate((e) => width && setDivider(Math.min(1, Math.max(0, e.x / width))));

  const image = (uri: string | null, style: object = {}) =>
    uri ? (
      <Image
        source={{ uri }}
        cachePolicy="none"
        contentFit="cover"
        style={[{ width: '100%', height: '100%' }, style]}
      />
    ) : null;

  if (mode === 'side') {
    return (
      <View className="flex-row gap-2">
        {[beforeUri, afterUri].map((uri, i) => (
          <View
            key={i}
            className="flex-1 overflow-hidden rounded-xl bg-surface-muted"
            style={{ aspectRatio: aspect }}>
            {image(uri)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <GestureDetector gesture={mode === 'slider' ? dividerGesture : Gesture.Native()}>
        <View
          onLayout={onLayout}
          className="overflow-hidden rounded-xl bg-surface-muted"
          style={{ aspectRatio: aspect }}
          accessible={mode === 'slider'}
          accessibilityRole={mode === 'slider' ? 'adjustable' : undefined}
          accessibilityLabel={mode === 'slider' ? t('compare.divider') : undefined}
          accessibilityValue={
            mode === 'slider' ? { text: `${Math.round(divider * 100)}%` } : undefined
          }
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            setDivider((d) =>
              Math.min(1, Math.max(0, d + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))),
            )
          }>
          {image(beforeUri)}
          {mode === 'overlay' ? (
            <View className="absolute inset-0">{image(afterUri, { opacity })}</View>
          ) : (
            <>
              {/* "After" revealed from the left up to the divider. */}
              <View
                className="absolute bottom-0 left-0 top-0 overflow-hidden"
                style={{ width: divider * width }}>
                <View style={{ width, height: '100%' }}>{image(afterUri)}</View>
              </View>
              <View
                pointerEvents="none"
                className="absolute bottom-0 top-0 w-0.5 bg-white"
                style={{ left: divider * width - 1 }}
              />
            </>
          )}
        </View>
      </GestureDetector>
      {mode === 'overlay' ? (
        <Slider
          label={t('compare.opacity')}
          value={opacity}
          min={0}
          max={1}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={setOpacity}
        />
      ) : null}
    </View>
  );
}

function PhotoStrip({
  label,
  list,
  selected,
  onSelect,
}: {
  label: string;
  list: Row[];
  selected: string;
  onSelect: (photoId: string) => void;
}) {
  const { t } = useTranslation('photos');
  return (
    <View className="gap-2">
      <Text variant="caption" className="font-body-medium">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2">
        {list.map((r) => {
          const date = r.takenAt.toLocaleDateString(i18n.language, { dateStyle: 'short' });
          const isSelected = r.photo.id === selected;
          return (
            <Pressable
              key={r.photo.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={t('compare.pick', { date })}
              onPress={() => onSelect(r.photo.id)}
              className={cn(
                'items-center gap-1 rounded-lg border-2 p-0.5',
                isSelected ? 'border-primary' : 'border-transparent',
              )}>
              <PhotoThumb thumbFileName={r.photo.thumbFileName} size={64} />
              <Text variant="caption">{date}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
