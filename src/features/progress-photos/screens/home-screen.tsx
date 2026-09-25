import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, EmptyState, IconButton, Screen, Text } from '@/shared/ui';

import { useCaptureSession } from '../capture/capture-session.store';
import { TimelineCard } from '../components/timeline-card';
import { useTimelineSummaries } from '../hooks/use-timelines';

export function HomeScreen() {
  const { t } = useTranslation();
  const { t: tp } = useTranslation('photos');
  const [showArchived, setShowArchived] = useState(false);
  const active = useTimelineSummaries({ archived: false });
  const archived = useTimelineSummaries({ archived: true });

  const openNew = () => router.push('/timeline/new');
  const openTimeline = (timelineId: string) =>
    router.push({ pathname: '/timeline/[timelineId]', params: { timelineId } });
  const newEntry = (timelineId: string) => {
    useCaptureSession.getState().start(timelineId);
    router.push({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
  };

  const timelines = (showArchived ? archived.data : active.data) ?? [];
  const hasArchived = (archived.data?.length ?? 0) > 0;
  const isEmpty = active.status === 'success' && !active.data.length && !showArchived;

  const header = (
    <View className="mb-2 mt-6 flex-row items-start justify-between gap-4">
      <View className="flex-1 gap-1">
        <Text variant="display" accessibilityRole="header">
          {showArchived ? tp('home.archived') : t('home.greeting')}
        </Text>
        {!showArchived ? (
          <Text variant="caption" className="text-base">
            {t('home.subtitle')}
          </Text>
        ) : null}
      </View>
      {!showArchived ? (
        <IconButton
          icon="plus"
          variant="surface"
          diameter={52}
          accessibilityLabel={tp('home.newTimeline')}
          onPress={openNew}
        />
      ) : null}
    </View>
  );

  return (
    <Screen className="px-5">
      {isEmpty ? (
        <>
          {header}
          <EmptyState
            icon="photos"
            title={t('home.empty.title')}
            description={t('home.empty.description')}
            action={
              <Button
                label={tp('home.newTimeline')}
                onPress={openNew}
                className="mt-2 self-stretch"
              />
            }
          />
        </>
      ) : (
        <FlatList
          data={timelines}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-10"
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <TimelineCard
              timeline={item}
              onPress={() => openTimeline(item.id)}
              onNewEntry={() => newEntry(item.id)}
            />
          )}
          ListFooterComponent={
            hasArchived || showArchived ? (
              <Button
                variant="ghost"
                label={showArchived ? tp('home.hideArchived') : tp('home.showArchived')}
                onPress={() => setShowArchived((v) => !v)}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
}
