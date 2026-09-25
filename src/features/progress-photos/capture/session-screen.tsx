import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Button, Card, EmptyState, Icon, IconButton, Text } from '@/shared/ui';

import { AngleIllustration, hasIllustration } from '../components/angle-illustration';
import { PhotoThumb } from '../components/photo-thumb';
import { useEntryPhotos } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { useCaptureSession } from './capture-session.store';
import { pickImage } from './gallery';

/** Checklist of the session's angles: each card opens the camera or the gallery import. */
export function SessionScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const scheme = useAppColorScheme();
  const details = useTimelineDetails(timelineId);
  const session = useCaptureSession();
  const entry = useEntryPhotos(session.timelineId === timelineId ? session.entryId : null);

  // Opened directly (deep link / restored state): start a fresh session.
  useEffect(() => {
    if (useCaptureSession.getState().timelineId !== timelineId) {
      useCaptureSession.getState().start(timelineId);
    }
  }, [timelineId]);

  if (details.status === 'loading') return null;
  if (!details.data) return <EmptyState title={t('timeline.notFound')} />;

  const angles = details.data.angles.filter((a) => a.isActive);
  const templateKey = details.data.timeline.templateKey;
  const photoByAngle = new Map((entry.data?.photos ?? []).map((p) => [p.angleId, p]));
  const done = angles.filter((a) => photoByAngle.has(a.id)).length;
  const takenAt = entry.data?.entry?.takenAt ?? new Date();

  const openCamera = (angleId: string) =>
    router.push({ pathname: '/timeline/[timelineId]/capture', params: { timelineId, angleId } });

  const importFromGallery = async (angleId: string) => {
    const picked = await pickImage();
    if (!picked) return;
    session.setPending({
      angleId,
      source: 'gallery',
      shots: [{ uri: picked.uri }],
      takenAt: picked.takenAt,
      assetId: picked.assetId,
    });
    router.push({ pathname: '/timeline/[timelineId]/review', params: { timelineId } });
  };

  const finish = () => {
    session.end();
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: t('session.title'),
          headerRight: () => <Button variant="ghost" label={t('session.done')} onPress={finish} />,
        }}
      />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12">
        <View className="gap-1">
          <Text variant="subtitle">
            {t('session.date', {
              date: takenAt.toLocaleDateString(i18n.language, { dateStyle: 'long' }),
            })}
          </Text>
          <Text variant="caption">{t('session.progress', { done, total: angles.length })}</Text>
        </View>

        {angles.map((angle) => {
          const photo = photoByAngle.get(angle.id);
          return (
            <Card key={angle.id} className="flex-row items-center gap-3 p-3">
              {photo ? (
                <PhotoThumb thumbFileName={photo.thumbFileName} size={64} />
              ) : hasIllustration(templateKey, angle.key) ? (
                <AngleIllustration templateKey={templateKey} angleKey={angle.key} size={64} />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
                  <Icon name="camera" color={colorOf(scheme, 'muted')} />
                </View>
              )}
              <View className="flex-1 gap-0.5">
                <Text className="font-body-semibold" numberOfLines={1}>
                  {angle.label}
                </Text>
                <View className="flex-row items-center gap-1">
                  {photo ? (
                    <Icon name="check" size={14} color={colorOf(scheme, 'success')} />
                  ) : null}
                  <Text variant="caption">
                    {photo ? t('session.captured') : t('session.pending')}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="photos"
                accessibilityLabel={`${t('session.import')}: ${angle.label}`}
                onPress={() => importFromGallery(angle.id)}
              />
              <IconButton
                icon="camera"
                color="primary"
                accessibilityLabel={`${t('session.takePhoto')}: ${angle.label}`}
                onPress={() => openCamera(angle.id)}
              />
            </Card>
          );
        })}

        <Button label={t('session.done')} onPress={finish} className="mt-2" />
      </ScrollView>
    </View>
  );
}
