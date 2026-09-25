import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { PressableCard, Text } from '@/shared/ui';

import type { TemplateKey } from '../db/progress-photos.schema';
import { templates } from '../templates';
import { TimelineIcon } from './timeline-icon';

type TemplatePickerProps = { value: TemplateKey; onChange: (key: TemplateKey) => void };

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  const { t } = useTranslation('photos');
  return (
    <View accessibilityRole="radiogroup" className="gap-3">
      {templates.map((template) => {
        const selected = template.key === value;
        return (
          <PressableCard
            key={template.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(template.key)}
            className={cn('flex-row items-center gap-4', selected && 'border-2 border-primary')}>
            <TimelineIcon icon={template.icon} color={template.color} />
            <View className="flex-1 gap-0.5">
              <Text variant="subtitle">{t(`templates.${template.key}.name`)}</Text>
              <Text variant="caption">{t(`templates.${template.key}.description`)}</Text>
            </View>
          </PressableCard>
        );
      })}
    </View>
  );
}
