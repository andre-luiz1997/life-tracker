import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, Section } from '@/shared/ui';

import { TemplatePicker } from '../components/template-picker';
import { TimelineFormFields } from '../components/timeline-form-fields';
import type { TemplateKey } from '../db/progress-photos.schema';
import { useTimelineService } from '../hooks/use-timelines';
import { timelineFormSchema, type TimelineFormValues } from '../lib/timeline-form';
import { getTemplate } from '../templates';

export function NewTimelineScreen() {
  const { t } = useTranslation('photos');
  const service = useTimelineService();

  const initial = getTemplate('weight_loss');
  const [templateKey, setTemplateKey] = useState<TemplateKey>(initial.key);
  const {
    control,
    handleSubmit,
    setValue,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: {
      title: t(`templates.${initial.key}.defaultTitle`),
      color: initial.color,
    },
  });

  // Switching templates also switches the suggested title/color, unless the user edited them.
  const selectTemplate = (key: TemplateKey) => {
    const template = getTemplate(key);
    setTemplateKey(key);
    if (!getFieldState('title').isDirty) setValue('title', t(`templates.${key}.defaultTitle`));
    if (!getFieldState('color').isDirty) setValue('color', template.color);
  };

  const onSubmit = handleSubmit((values) => {
    const id = service.create({ ...values, templateKey });
    router.replace({ pathname: '/timeline/[timelineId]', params: { timelineId: id } });
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('newTimeline.title') }} />
      <ScrollView contentContainerClassName="gap-8 p-4 pb-12" keyboardShouldPersistTaps="handled">
        <Section title={t('newTimeline.chooseTemplate')}>
          <TemplatePicker value={templateKey} onChange={selectTemplate} />
        </Section>
        <Section title={t('newTimeline.details')}>
          <TimelineFormFields control={control} errors={errors} />
        </Section>
        <Button label={t('newTimeline.create')} onPress={onSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
