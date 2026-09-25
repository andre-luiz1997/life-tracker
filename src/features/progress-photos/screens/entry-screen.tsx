import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { Button, DateField, EmptyState, IconButton, Section, Text, TextField } from '@/shared/ui';

import { useCaptureSession } from '../capture/capture-session.store';
import { PhotoThumb } from '../components/photo-thumb';
import type { Entry, MetricDefinition, MetricValue } from '../db/progress-photos.schema';
import { useEntryDetails, useEntryService, usePhotoService } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { formatDecimal, parseDecimal } from '../lib/metrics';

type Props = { timelineId: string; entryId: string };

export function EntryScreen({ timelineId, entryId }: Props) {
  const { t } = useTranslation('photos');
  const details = useTimelineDetails(timelineId);
  const entry = useEntryDetails(entryId);

  if (details.status === 'loading' || entry.status === 'loading') return null;
  if (!details.data || !entry.data) return <EmptyState title={t('timeline.notFound')} />;

  return (
    <EntryForm
      // Remount the form when the entry is replaced (e.g. deleted and recreated).
      key={entry.data.entry.id}
      timelineId={timelineId}
      entry={entry.data.entry}
      values={entry.data.values}
      metrics={details.data.metrics}
      photos={entry.data.photos.map((p) => ({
        ...p,
        angleLabel: details.data!.angles.find((a) => a.id === p.angleId)?.label ?? '',
      }))}
    />
  );
}

type FormProps = {
  timelineId: string;
  entry: Entry;
  values: MetricValue[];
  metrics: MetricDefinition[];
  photos: { id: string; thumbFileName: string; angleLabel: string }[];
};

function EntryForm({ timelineId, entry, values, metrics, photos }: FormProps) {
  const { t } = useTranslation('photos');
  const entryService = useEntryService();
  const photoService = usePhotoService();
  const locale = i18n.language;

  const [takenAt, setTakenAt] = useState(entry.takenAt);
  const [note, setNote] = useState(entry.note ?? '');
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      metrics.map((m) => {
        const v = values.find((x) => x.metricId === m.id)?.value;
        return [m.id, v === undefined ? '' : formatDecimal(v, locale, 3)];
      }),
    ),
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const onSave = () => {
    const parsed = Object.fromEntries(metrics.map((m) => [m.id, parseDecimal(inputs[m.id] ?? '')]));
    const invalid = Object.fromEntries(
      Object.entries(parsed).map(([id, v]) => [id, typeof v === 'number' && Number.isNaN(v)]),
    );
    setErrors(invalid);
    if (Object.values(invalid).some(Boolean)) return;

    entryService.update(entry.id, { takenAt, note });
    entryService.setMetricValues(entry.id, parsed);
    router.back();
  };

  const addPhotos = () => {
    useCaptureSession.getState().start(timelineId, entry.id);
    router.push({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
  };

  const confirmDeletePhoto = (photoId: string) =>
    Alert.alert(t('entry.deletePhotoConfirm'), undefined, [
      { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
      {
        text: t('actions.delete', { ns: 'common' }),
        style: 'destructive',
        onPress: () => {
          // Deleting the last photo deletes the entry too.
          if (photos.length === 1) router.back();
          photoService.deletePhoto(photoId);
        },
      },
    ]);

  const confirmDeleteEntry = () =>
    Alert.alert(t('entry.deleteConfirmTitle'), t('entry.deleteConfirmMessage'), [
      { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
      {
        text: t('actions.delete', { ns: 'common' }),
        style: 'destructive',
        onPress: () => {
          router.back();
          entryService.remove(entry.id);
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: t('entry.title'),
          headerRight: () => (
            <Button variant="ghost" label={t('actions.save', { ns: 'common' })} onPress={onSave} />
          ),
        }}
      />
      <ScrollView contentContainerClassName="gap-8 p-4 pb-16" keyboardShouldPersistTaps="handled">
        <View className="gap-3">
          <DateField
            label={t('entry.date')}
            value={takenAt}
            onChange={(d) => setTakenAt(withDate(takenAt, d))}
            locale={locale}
            maximumDate={new Date()}
          />
          <DateField
            label={t('entry.time')}
            mode="time"
            value={takenAt}
            onChange={(d) => setTakenAt(withTime(takenAt, d))}
            locale={locale}
          />
          <TextField
            label={t('entry.note')}
            placeholder={t('entry.notePlaceholder')}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            className="min-h-20 py-3"
          />
        </View>

        {metrics.length ? (
          <Section title={t('entry.metrics')}>
            {metrics.map((metric) => (
              <View key={metric.id} className="flex-row items-center gap-3">
                <Text className="flex-1">{metric.label}</Text>
                <TextField
                  containerClassName="w-32"
                  accessibilityLabel={`${metric.label} (${metric.unit})`}
                  value={inputs[metric.id] ?? ''}
                  onChangeText={(text) => setInputs((prev) => ({ ...prev, [metric.id]: text }))}
                  keyboardType="decimal-pad"
                  error={errors[metric.id] ? t('entry.invalidNumber') : undefined}
                  className="text-right"
                />
                <Text variant="caption" className="w-10">
                  {metric.unit}
                </Text>
              </View>
            ))}
          </Section>
        ) : null}

        <Section title={t('entry.photos')}>
          <View className="flex-row flex-wrap gap-3">
            {photos.map((photo) => (
              <View key={photo.id} className="items-center gap-1">
                <PhotoThumb thumbFileName={photo.thumbFileName} size={96} />
                <Text variant="caption" numberOfLines={1} className="w-24 text-center">
                  {photo.angleLabel}
                </Text>
                <IconButton
                  icon="trash"
                  size={18}
                  color="danger"
                  accessibilityLabel={`${t('entry.deletePhoto')}: ${photo.angleLabel}`}
                  onPress={() => confirmDeletePhoto(photo.id)}
                />
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={addPhotos} className="py-2">
            <Text className="font-body-semibold text-primary">{t('entry.addPhotos')}</Text>
          </Pressable>
        </Section>

        <Button variant="danger" label={t('entry.delete')} onPress={confirmDeleteEntry} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function withDate(base: Date, date: Date) {
  const d = new Date(base);
  d.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return d;
}

function withTime(base: Date, time: Date) {
  const d = new Date(base);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}
