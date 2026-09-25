import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, EmptyState, Section } from '@/shared/ui';

import { AnglesEditor } from '../components/angles-editor';
import { MetricsEditor } from '../components/metrics-editor';
import { TimelineFormFields } from '../components/timeline-form-fields';
import type { Timeline } from '../db/progress-photos.schema';
import { useTimelineDetails, useTimelineService } from '../hooks/use-timelines';
import { timelineFormSchema, type TimelineFormValues } from '../lib/timeline-form';
import { ReminderEditor } from '../reminders/reminder-editor';
import type { TimelineService } from '../services/timeline.service';

export function TimelineSettingsScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const service = useTimelineService();
  const details = useTimelineDetails(timelineId);

  if (details.status === 'loading') return null;
  if (!details.data) return <EmptyState title={t('timeline.notFound')} />;

  const { timeline, angles, metrics } = details.data;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('timelineSettings.title') }} />
      <ScrollView contentContainerClassName="gap-8 p-4 pb-16" keyboardShouldPersistTaps="handled">
        <Section title={t('timelineSettings.general')}>
          <GeneralForm timeline={timeline} service={service} />
        </Section>

        <Section title={t('reminders.title')}>
          <ReminderEditor timeline={timeline} service={service} />
        </Section>

        <Section title={t('timelineSettings.angles')} hint={t('timelineSettings.anglesHint')}>
          <AnglesEditor timelineId={timelineId} angles={angles} service={service} />
        </Section>

        <Section title={t('timelineSettings.metrics')} hint={t('timelineSettings.metricsHint')}>
          <MetricsEditor
            timelineId={timelineId}
            templateKey={timeline.templateKey}
            metrics={metrics}
            service={service}
          />
        </Section>

        <Section title={t('timelineSettings.dangerZone')}>
          <DangerZone timeline={timeline} service={service} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GeneralForm({ timeline, service }: { timeline: Timeline; service: TimelineService }) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: { title: timeline.title, color: timeline.color },
  });

  // Keep the form in sync after saving (the query refreshes `timeline`).
  useEffect(() => {
    reset({ title: timeline.title, color: timeline.color });
  }, [timeline.title, timeline.color, reset]);

  const onSave = handleSubmit((values) => service.update(timeline.id, values));

  return (
    <View className="gap-4">
      <TimelineFormFields control={control} errors={errors} onSubmitEditing={onSave} />
      <Button label={t('actions.save')} onPress={onSave} disabled={!isDirty} />
    </View>
  );
}

function DangerZone({ timeline, service }: { timeline: Timeline; service: TimelineService }) {
  const { t } = useTranslation('photos');
  const isArchived = timeline.archivedAt !== null;

  const toggleArchive = () => {
    service.setArchived(timeline.id, !isArchived);
    if (!isArchived) router.dismissTo('/');
  };

  const confirmDelete = () =>
    Alert.alert(
      t('timelineSettings.deleteConfirmTitle', { title: timeline.title }),
      t('timelineSettings.deleteConfirmMessage'),
      [
        { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
        {
          text: t('actions.delete', { ns: 'common' }),
          style: 'destructive',
          onPress: () => {
            router.dismissTo('/');
            service.remove(timeline.id);
          },
        },
      ],
    );

  return (
    <View className="gap-3">
      <Button
        variant="secondary"
        label={isArchived ? t('timelineSettings.unarchive') : t('timelineSettings.archive')}
        onPress={toggleArchive}
      />
      <Button variant="danger" label={t('timelineSettings.delete')} onPress={confirmDelete} />
    </View>
  );
}
