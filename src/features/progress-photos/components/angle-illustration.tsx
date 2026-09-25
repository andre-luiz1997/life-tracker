import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { cn } from '@/shared/lib/cn';

import type { TemplateKey } from '../db/progress-photos.schema';
import { angleIllustration } from '../templates/illustrations';

type Props = { templateKey: TemplateKey; angleKey: string; size: number; className?: string };

/** Pose guide for an angle on a light rounded tile. Renders nothing for custom angles. */
export function AngleIllustration({ templateKey, angleKey, size, className }: Props) {
  const xml = angleIllustration(templateKey, angleKey);
  if (!xml) return null;
  return (
    <View
      className={cn('overflow-hidden bg-[#F5F4F0]', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

export function hasIllustration(templateKey: TemplateKey, angleKey: string) {
  return angleIllustration(templateKey, angleKey) !== null;
}
