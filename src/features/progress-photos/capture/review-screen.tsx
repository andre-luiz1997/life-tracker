import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Button, Text } from '@/shared/ui';

import { useCaptureSession } from './capture-session.store';
import { pickImage } from './gallery';
import { discardTempImage } from './image-processing';
import { useSavePending } from './use-save-pending';

export function ReviewScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const insets = useSafeAreaInsets();
  const pending = useCaptureSession((s) => s.pending);
  const { save, saving } = useSavePending(timelineId);
  const [selected, setSelected] = useState(0);

  // Whatever is still pending when leaving (not saved) is plaintext in the cache: delete it.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(
    () => () => {
      pendingRef.current?.shots.forEach((shot) => discardTempImage(shot.uri));
      useCaptureSession.getState().setPending(null);
    },
    [],
  );

  if (!pending) return null;
  const index = pending.shots[selected] ? selected : 0;
  const shot = pending.shots[index]!;

  const retake = async () => {
    const { setPending } = useCaptureSession.getState();
    pending.shots.forEach((s) => discardTempImage(s.uri));
    if (pending.source === 'camera') {
      setPending(null);
      router.back();
      return;
    }
    const picked = await pickImage();
    if (!picked) {
      setPending(null);
      router.back();
      return;
    }
    setSelected(0);
    setPending({
      ...pending,
      shots: [{ uri: picked.uri }],
      takenAt: picked.takenAt,
      assetId: picked.assetId,
    });
  };

  const openEditor = () =>
    router.push({
      pathname: '/timeline/[timelineId]/edit',
      params: { timelineId, shot: String(index) },
    });

  return (
    <View
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text className="py-3 text-center font-semibold text-white">
        {pending.shots.length > 1 ? t('capture.burst') : t('capture.review')}
      </Text>
      <Image
        source={{ uri: shot.uri }}
        cachePolicy="none"
        contentFit="contain"
        style={{ flex: 1 }}
      />

      {pending.shots.length > 1 ? (
        <ScrollView horizontal contentContainerClassName="gap-2 px-4 py-3" className="grow-0">
          {pending.shots.map((s, i) => (
            <Pressable
              key={s.uri}
              accessibilityRole="radio"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`${i + 1}`}
              onPress={() => setSelected(i)}
              className={cn(
                'overflow-hidden rounded-lg border-2',
                i === index ? 'border-primary' : 'border-transparent',
              )}>
              <Image
                source={{ uri: s.uri }}
                cachePolicy="none"
                contentFit="cover"
                style={{ width: 72, height: 96 }}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View className="flex-row gap-2 px-4 pt-3">
        <Button
          variant="secondary"
          label={t('capture.retake')}
          onPress={retake}
          disabled={saving}
          className="flex-1"
        />
        <Button
          variant="secondary"
          label={t('capture.edit')}
          onPress={openEditor}
          disabled={saving}
          className="flex-1"
        />
        <Button
          label={saving ? t('capture.saving') : t('capture.use')}
          onPress={() => save(shot)}
          loading={saving}
          className="flex-1"
        />
      </View>
    </View>
  );
}
