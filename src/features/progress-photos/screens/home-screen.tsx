import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, EmptyState, IconButton, Screen, Text } from '@/shared/ui';

import { TimelineCard } from '../components/timeline-card';
import { useTimelineSummaries } from '../hooks/use-timelines';

export function HomeScreen() {
  const { t } = useTranslation();
  const { t: tp } = useTranslation('photos');
  const [showArchived, setShowArchived] = useState(false);
  const active = useTimelineSummaries({ archived: false });
  const archived = useTimelineSummaries({ archived: true });

  const openNew = () => router.push('/timeline/new');
  const timelines = (showArchived ? archived.data : active.data) ?? [];
  const hasArchived = (archived.data?.length ?? 0) > 0;
  const isEmpty = active.status === 'success' && !active.data.length && !showArchived;

  return (
    <Screen>
      <View className="mb-4 mt-4 flex-row items-center justify-between">
        <Text variant="title" accessibilityRole="header">
          {showArchived ? tp('home.archived') : t('home.title')}
        </Text>
        {!showArchived ? (
          <IconButton
            icon="plus"
            color="primary"
            accessibilityLabel={tp('home.newTimeline')}
            onPress={openNew}
          />
        ) : null}
      </View>

      {isEmpty ? (
        <EmptyState
          title={t('home.empty.title')}
          description={t('home.empty.description')}
          action={<Button label={tp('home.newTimeline')} onPress={openNew} className="mt-2" />}
        />
      ) : (
        <FlatList
          data={timelines}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 pb-8"
          renderItem={({ item }) => (
            <TimelineCard
              timeline={item}
              onPress={() =>
                router.push({ pathname: '/timeline/[timelineId]', params: { timelineId: item.id } })
              }
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
