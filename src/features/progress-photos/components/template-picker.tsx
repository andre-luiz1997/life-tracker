import { Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Icon, Text } from '@/shared/ui';

import type { TemplateKey } from '../db/progress-photos.schema';
import { templates } from '../templates';
import { INK, TimelineIcon } from './timeline-icon';

type TemplatePickerProps = { value: TemplateKey; onChange: (key: TemplateKey) => void };

/** 2×2 grid of pastel tiles; the selected template's description shows below. */
export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  const { t } = useTranslation('photos');
  return (
    <View className="gap-4">
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap justify-between gap-y-3">
        {templates.map((template) => {
          const selected = template.key === value;
          return (
            <Pressable
              key={template.key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityHint={t(`templates.${template.key}.description`)}
              onPress={() => onChange(template.key)}
              className={cn(
                'min-h-36 w-[48.5%] justify-between rounded-card p-4 active:opacity-90',
                selected ? 'border-[3px] border-primary' : 'border-[3px] border-transparent',
              )}
              style={{ backgroundColor: template.color }}>
              <View className="flex-row items-start justify-between">
                <TimelineIcon icon={template.icon} color="rgba(255,255,255,0.6)" size={48} />
                {selected ? (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <Icon name="check" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <Text className="font-body-semibold text-base leading-5" style={{ color: INK }}>
                {t(`templates.${template.key}.name`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" className="px-1 text-base">
        {t(`templates.${value}.description`)}
      </Text>
    </View>
  );
}
