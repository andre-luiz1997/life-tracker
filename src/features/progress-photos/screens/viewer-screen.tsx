import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { i18n, useTranslation } from '@/core/i18n';
import { IconButton, Text } from '@/shared/ui';

import type { Photo } from '../db/progress-photos.schema';
import { clearDecryptedPhotos, useFullPhoto } from '../hooks/use-photo-source';
import { useAnglePhotos } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { daysBetween } from '../lib/dates';

type Props = { timelineId: string; angleId: string; photoId?: string };

/** Full-screen photos of one angle; swipe moves between dates. */
export function ViewerScreen({ timelineId, angleId, photoId }: Props) {
  const { t } = useTranslation('photos');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const details = useTimelineDetails(timelineId);
  const photos = useAnglePhotos(angleId);
  const [index, setIndex] = useState<number | null>(null);

  // Decrypted temp files must not outlive the viewer.
  useEffect(() => () => clearDecryptedPhotos(), []);

  if (photos.status !== 'success' || !details.data) return null;
  const list = photos.data;
  const initial = Math.max(
    0,
    list.findIndex((r) => r.photo.id === photoId),
  );
  const current = index ?? initial;
  const item = list[current];
  const angle = details.data.angles.find((a) => a.id === angleId);
  const first = list[0];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={list}
        horizontal
        pagingEnabled
        initialScrollIndex={initial}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        keyExtractor={(r) => r.photo.id}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item: r }) => <ViewerPage photo={r.photo} width={width} />}
      />

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 flex-row items-center bg-black/40 px-2 pb-2"
        style={{ paddingTop: insets.top + 4 }}>
        <IconButton
          icon="close"
          color="on-primary"
          accessibilityLabel={t('viewer.close')}
          onPress={() => router.back()}
        />
        <View className="flex-1 items-center">
          <Text className="font-semibold text-white">{angle?.label}</Text>
          {item ? (
            <Text className="text-xs text-white/80">
              {item.takenAt.toLocaleDateString(i18n.language, { dateStyle: 'medium' })}
              {first
                ? ` · ${t('feed.day', { n: daysBetween(first.takenAt, item.takenAt) + 1 })}`
                : ''}
            </Text>
          ) : null}
        </View>
        <Text className="w-10 text-center text-xs text-white/80">
          {t('viewer.position', { current: current + 1, total: list.length })}
        </Text>
      </View>
    </View>
  );
}

function ViewerPage({ photo, width }: { photo: Photo; width: number }) {
  const uri = useFullPhoto(photo.fileName);
  return (
    <View style={{ width }} className="items-center justify-center">
      {uri ? (
        <Image
          source={{ uri }}
          cachePolicy="none"
          contentFit="contain"
          style={{ width, height: '100%' }}
        />
      ) : (
        <ActivityIndicator color="white" />
      )}
    </View>
  );
}
