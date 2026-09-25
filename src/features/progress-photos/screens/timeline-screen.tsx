import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Button, Card, Chip, EmptyState, Icon, IconButton, Tag, Text } from '@/shared/ui';

import { useCaptureSession } from '../capture/capture-session.store';
import { EntryCard } from '../components/entry-card';
import { TimelineIcon } from '../components/timeline-icon';
import { useTimelineFeed } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { daysBetween } from '../lib/dates';
import { getTemplate } from '../templates';

export function TimelineScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const scheme = useAppColorScheme();
  const details = useTimelineDetails(timelineId);
  const feed = useTimelineFeed(timelineId);
  const [angleFilter, setAngleFilter] = useState<string | null>(null);

  if (details.status === 'loading' || feed.status === 'loading') return null;
  if (!details.data || !feed.data) return <EmptyState title={t('timeline.notFound')} />;

  const { timeline, angles, metrics } = details.data;
  const { entries, photosByEntry, valuesByEntry } = feed.data;
  const template = getTemplate(timeline.templateKey);
  const activeAngles = angles.filter((a) => a.isActive);
  const firstDate = entries.at(-1)?.takenAt;

  const push = (
    pathname:
      | '/timeline/[timelineId]/settings'
      | '/timeline/[timelineId]/metrics'
      | '/timeline/[timelineId]/compare',
  ) => router.push({ pathname, params: { timelineId } });

  const newEntry = () => {
    useCaptureSession.getState().start(timelineId);
    router.push({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
  };

  const header = (
    <View className="gap-6 pb-2">
      <Card className="gap-5">
        <View className="flex-row items-center gap-4">
          <TimelineIcon icon={timeline.icon} color={timeline.color} size={64} />
          <View className="flex-1 gap-1">
            <Text variant="title" numberOfLines={3}>
              {timeline.title}
            </Text>
            <Text variant="caption">{t(`templates.${timeline.templateKey}.name`)}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Tag color={`${timeline.color}66`} label={t('home.entries', { count: entries.length })} />
          <View className="flex-1" />
          {entries.length > 1 ? (
            <IconButton
              icon="photos"
              color="on-accent"
              style={{ backgroundColor: timeline.color }}
              accessibilityLabel={t('feed.compare')}
              onPress={() => push('/timeline/[timelineId]/compare')}
            />
          ) : null}
          {metrics.length ? (
            <IconButton
              icon="chart"
              color="on-accent"
              style={{ backgroundColor: timeline.color }}
              accessibilityLabel={t('feed.metrics')}
              onPress={() => push('/timeline/[timelineId]/metrics')}
            />
          ) : null}
        </View>
      </Card>

      <Button label={t('timeline.newEntry')} onPress={newEntry} />

      {entries.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          accessibilityLabel={t('feed.filterByAngle')}>
          {[{ id: null, label: t('feed.all') }, ...activeAngles].map((angle) => (
            <Chip
              key={angle.id ?? 'all'}
              label={angle.label}
              selected={angleFilter === angle.id}
              onPress={() => setAngleFilter(angle.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <>
          <Card className="items-center py-10">
            <EmptyState
              icon="camera"
              title={t('timeline.noEntries')}
              description={t('timeline.noEntriesDescription')}
            />
          </Card>
          <View className="gap-3 rounded-card bg-accent p-5">
            <View className="flex-row items-center gap-2">
              <Icon name="lightbulb" size={18} color={colorOf(scheme, 'on-accent')} />
              <Text className="font-body-semibold text-on-accent">{t('timeline.tips')}</Text>
            </View>
            {template.tips.map((tip) => (
              <Text key={tip} className="text-on-accent">
                • {t(`tips.${timeline.templateKey}.${tip}` as 'tips.custom.consistency')}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: timeline.title,
          headerRight: () => (
            <IconButton
              icon="settings"
              accessibilityLabel={t('timeline.settings')}
              onPress={() => push('/timeline/[timelineId]/settings')}
            />
          ),
        }}
      />
      <FlatList
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 px-5 pb-12 pt-2"
        data={entries}
        keyExtractor={(entry) => entry.id}
        ListHeaderComponent={header}
        renderItem={({ item: entry }) => {
          const photos = (photosByEntry.get(entry.id) ?? []).filter(
            (p) => !angleFilter || p.angleId === angleFilter,
          );
          return (
            <EntryCard
              entry={entry}
              dayNumber={firstDate ? daysBetween(firstDate, entry.takenAt) : 0}
              photos={photos}
              angles={angles}
              metrics={metrics}
              values={valuesByEntry.get(entry.id)}
              onPress={() =>
                router.push({
                  pathname: '/timeline/[timelineId]/entry/[entryId]',
                  params: { timelineId, entryId: entry.id },
                })
              }
              onPhotoPress={(photo) =>
                router.push({
                  pathname: '/timeline/[timelineId]/viewer',
                  params: { timelineId, angleId: photo.angleId, photoId: photo.id },
                })
              }
            />
          );
        }}
      />
    </>
  );
}
