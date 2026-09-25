import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Button, Card, EmptyState, Icon, IconButton, Section, Text } from '@/shared/ui';

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
    <View className="gap-5 pb-2">
      <View className="flex-row items-center gap-4">
        <TimelineIcon icon={timeline.icon} color={timeline.color} size={56} />
        <View className="flex-1">
          <Text variant="title" numberOfLines={2}>
            {timeline.title}
          </Text>
          <Text variant="caption">
            {t(`templates.${timeline.templateKey}.name`)} ·{' '}
            {t('home.entries', { count: entries.length })}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button label={t('timeline.newEntry')} onPress={newEntry} className="flex-1" />
        {entries.length > 1 ? (
          <Button
            variant="secondary"
            label={t('feed.compare')}
            onPress={() => push('/timeline/[timelineId]/compare')}
          />
        ) : null}
        {metrics.length ? (
          <Button
            variant="secondary"
            label={t('feed.metrics')}
            onPress={() => push('/timeline/[timelineId]/metrics')}
          />
        ) : null}
      </View>

      {entries.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          accessibilityLabel={t('feed.filterByAngle')}>
          {[{ id: null, label: t('feed.all') }, ...activeAngles].map((angle) => (
            <Pressable
              key={angle.id ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: angleFilter === angle.id }}
              onPress={() => setAngleFilter(angle.id)}
              className={cn(
                'rounded-full px-3 py-1.5',
                angleFilter === angle.id ? 'bg-primary' : 'bg-surface-muted',
              )}>
              <Text
                variant="caption"
                className={angleFilter === angle.id ? 'text-on-primary' : 'text-foreground'}>
                {angle.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <>
          <Card className="items-center py-10">
            <EmptyState
              title={t('timeline.noEntries')}
              description={t('timeline.noEntriesDescription')}
            />
          </Card>
          <Section title={t('timeline.tips')}>
            <Card className="gap-3">
              {template.tips.map((tip) => (
                <View key={tip} className="flex-row gap-3">
                  <Icon name="lightbulb" size={18} color={colorOf(scheme, 'muted')} />
                  <Text className="flex-1">
                    {t(`tips.${timeline.templateKey}.${tip}` as 'tips.custom.consistency')}
                  </Text>
                </View>
              ))}
            </Card>
          </Section>
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
        contentContainerClassName="gap-3 p-4 pb-12"
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
