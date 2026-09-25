import { Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Section, Text } from '@/shared/ui';

import { setFigureGender, useFigureGender } from '../hooks/use-figure-gender';
import { FIGURE_GENDERS } from '../templates/illustrations';
import { AngleIllustration } from './angle-illustration';

/** Settings section: style of the pose-guide figures, picked from live previews. */
export function FigureSettings() {
  const { t } = useTranslation('photos');
  const current = useFigureGender();

  return (
    <Section title={t('figures.title')} hint={t('figures.hint')}>
      <View accessibilityRole="radiogroup" className="flex-row gap-3">
        {FIGURE_GENDERS.map((gender) => {
          const selected = gender === current;
          return (
            <Pressable
              key={gender}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`figures.${gender}`)}
              onPress={() => setFigureGender(gender)}
              className={cn(
                'flex-1 items-center gap-2 rounded-card border-[3px] bg-surface p-2 pb-3 active:opacity-90',
                selected ? 'border-primary' : 'border-transparent',
              )}>
              <AngleIllustration
                templateKey="weight_loss"
                angleKey="body_front"
                gender={gender}
                size={92}
              />
              <Text className={cn('text-sm', selected ? 'font-body-semibold' : 'font-body-medium')}>
                {t(`figures.${gender}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}
