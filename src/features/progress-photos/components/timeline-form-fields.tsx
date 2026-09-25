import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Text, TextField } from '@/shared/ui';

import { TITLE_MAX_LENGTH, type TimelineFormValues } from '../lib/timeline-form';
import { ColorPicker } from './color-picker';

type Props = {
  control: Control<TimelineFormValues>;
  errors: FieldErrors<TimelineFormValues>;
  onSubmitEditing?: () => void;
};

export function TimelineFormFields({ control, errors, onSubmitEditing }: Props) {
  const { t } = useTranslation('photos');
  const titleError = errors.title?.message as 'titleRequired' | 'titleTooLong' | undefined;

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label={t('form.title')}
            placeholder={t('form.titlePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={TITLE_MAX_LENGTH}
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            error={titleError ? t(`form.${titleError}`, { max: TITLE_MAX_LENGTH }) : undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View className="gap-2">
            <Text variant="caption" className="font-medium">
              {t('form.color')}
            </Text>
            <ColorPicker label={t('form.color')} value={field.value} onChange={field.onChange} />
          </View>
        )}
      />
    </View>
  );
}
