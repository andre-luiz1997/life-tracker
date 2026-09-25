import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useTranslation } from '@/core/i18n';

import { usePhotoService } from '../hooks/use-photos';
import type { ProcessedImage } from '../services/photo.service';
import { type PendingCapture, type PendingShot, useCaptureSession } from './capture-session.store';
import { deleteOriginal } from './gallery';
import { discardTempImage } from './image-processing';

/**
 * Saves the chosen pending shot into the session's entry (review "Use" and editor "Save"),
 * discards the rest of a burst, offers to delete the gallery original and returns to the session.
 */
export function useSavePending(timelineId: string) {
  const { t } = useTranslation('photos');
  const service = usePhotoService();
  const [saving, setSaving] = useState(false);

  const offerGalleryRemoval = (capture: PendingCapture) =>
    new Promise<void>((resolve) => {
      Alert.alert(t('gallery.removeTitle'), t('gallery.removeMessage'), [
        { text: t('gallery.keep'), style: 'cancel', onPress: () => resolve() },
        {
          text: t('gallery.remove'),
          style: 'destructive',
          onPress: async () => {
            const result = await deleteOriginal(capture.assetId ?? null);
            if (result === 'deleted') return resolve();
            Alert.alert(t('gallery.manualTitle'), t('gallery.manualMessage'), [
              { onPress: () => resolve() },
            ]);
          },
        },
      ]);
    });

  const save = async (shot: PendingShot, image?: ProcessedImage) => {
    const { pending, entryId, setEntry, setPending } = useCaptureSession.getState();
    if (!pending) return;
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
        image,
        entry: entryId ? { id: entryId } : { takenAt: pending.takenAt ?? new Date() },
      });
      setEntry(result.entryId);
      // The chosen shot was consumed by save(); discard the rest of the burst.
      pending.shots.filter((s) => s.uri !== shot.uri).forEach((s) => discardTempImage(s.uri));
      setPending(null);
      if (pending.source === 'gallery') await offerGalleryRemoval(pending);
      router.dismissTo({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
    } catch (error) {
      if (__DEV__) console.error(error);
      Alert.alert(t('capture.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
