import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Button, Text } from '@/shared/ui';

import { usePhotoService } from '../hooks/use-photos';
import { type PendingCapture, useCaptureSession } from './capture-session.store';
import { deleteOriginal, pickImage } from './gallery';
import { discardTempImage } from './image-processing';

export function ReviewScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const insets = useSafeAreaInsets();
  const service = usePhotoService();
  const pending = useCaptureSession((s) => s.pending);
  const entryId = useCaptureSession((s) => s.entryId);
  const { setPending, setEntry } = useCaptureSession.getState();
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);

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
  const shot = pending.shots[selected] ?? pending.shots[0]!;

  const backToSession = () =>
    router.dismissTo({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });

  const retake = async () => {
    pending.shots.forEach((s) => discardTempImage(s.uri));
    if (pending.source === 'camera') {
      setPending(null);
      router.back();
      return;
    }
    const picked = await pickImage();
    if (!picked) return backToSession();
    setSelected(0);
    setPending({
      ...pending,
      shots: [{ uri: picked.uri }],
      takenAt: picked.takenAt,
      assetId: picked.assetId,
    });
  };

  const offerGalleryRemoval = (capture: PendingCapture) =>
    new Promise<void>((resolve) => {
      Alert.alert(t('gallery.removeTitle'), t('gallery.removeMessage'), [
        { text: t('gallery.keep'), style: 'cancel', onPress: () => resolve() },
        {
          text: t('gallery.remove'),
          style: 'destructive',
          onPress: async () => {
            const result = await deleteOriginal(capture.assetId ?? null);
            if (result !== 'deleted') {
              Alert.alert(t('gallery.manualTitle'), t('gallery.manualMessage'), [
                { onPress: () => resolve() },
              ]);
            } else resolve();
          },
        },
      ]);
    });

  const use = async () => {
    setSaving(true);
    try {
      const result = await service.save({
        timelineId,
        angleId: pending.angleId,
        sourceUri: shot.uri,
        // Camera sizes match the decoded orientation; gallery sizes may not (EXIF rotation).
        sourceSize:
          pending.source === 'camera' && shot.width && shot.height
            ? { width: shot.width, height: shot.height }
            : undefined,
        source: pending.source,
        entry: entryId ? { id: entryId } : { takenAt: pending.takenAt ?? new Date() },
      });
      setEntry(result.entryId);
      // The chosen shot was consumed by save(); discard the rest of the burst.
      pending.shots.filter((s) => s !== shot).forEach((s) => discardTempImage(s.uri));
      setPending(null);
      if (pending.source === 'gallery') await offerGalleryRemoval(pending);
      backToSession();
    } catch (error) {
      if (__DEV__) console.error(error);
      Alert.alert(t('capture.saveError'));
    } finally {
      setSaving(false);
    }
  };

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
              accessibilityState={{ selected: i === selected }}
              accessibilityLabel={`${i + 1}`}
              onPress={() => setSelected(i)}
              className={cn(
                'overflow-hidden rounded-lg border-2',
                i === selected ? 'border-primary' : 'border-transparent',
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

      <View className="flex-row gap-3 px-4 pt-3">
        <Button
          variant="secondary"
          label={t('capture.retake')}
          onPress={retake}
          disabled={saving}
          className="flex-1"
        />
        <Button
          label={saving ? t('capture.saving') : t('capture.use')}
          onPress={use}
          loading={saving}
          className="flex-1"
        />
      </View>
    </View>
  );
}
