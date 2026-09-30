import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useTranslation } from '@/core/i18n';

import { usePhotoService } from '../hooks/use-photos';
import type { ProcessedImage } from '../services/photo.service';
import { type PendingShot, useCaptureSession } from './capture-session.store';
import { editorError, editorLog } from '../editor/debug-log';
import { discardTempImage } from './image-processing';

/**
 * Saves the chosen pending shot into the session's entry (review "Use" and editor "Save"),
 * discards the rest of a burst and returns to the session.
 */
export function useSavePending(timelineId: string) {
  const { t } = useTranslation('photos');
  const service = usePhotoService();
  const [saving, setSaving] = useState(false);

  const save = async (shot: PendingShot, image?: ProcessedImage) => {
    const { pending, entryId, setEntry, setPending } = useCaptureSession.getState();
    if (!pending) {
      editorLog('useSavePending: no pending capture, nothing to save');
      return;
    }
    editorLog('useSavePending: start', {
      source: pending.source,
      edited: !!image,
      entryId,
      fullBytes: image?.full.bytes.length,
      thumbBytes: image?.thumb.bytes.length,
    });
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
      editorLog('useSavePending: saved', { entryId: result.entryId });
      setEntry(result.entryId);
      // The chosen shot was consumed by save(); discard the rest of the burst.
      pending.shots.filter((s) => s.uri !== shot.uri).forEach((s) => discardTempImage(s.uri));
      setPending(null);
      router.dismissTo({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
    } catch (error) {
      editorError('useSavePending', error);
      Alert.alert(t('capture.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
