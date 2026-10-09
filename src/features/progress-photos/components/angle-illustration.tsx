import { Image } from 'expo-image';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { cn } from '@/shared/lib/cn';

import type { TemplateKey } from '../db/progress-photos.schema';
import { useFigureGender } from '../hooks/use-figure-gender';
import { angleIllustration, type FigureGender } from '../templates/illustrations';
import { posePhoto } from '../templates/photos';

type Props = {
  templateKey: TemplateKey;
  angleKey: string;
  size: number;
  className?: string;
  /** Overrides the user's figure style (used by the style picker previews). */
  gender?: FigureGender;
};

/**
 * Pose guide for an angle on a light rounded tile: a realistic example photo when one was
 * imported for the angle and style, otherwise the drawn figure. Renders nothing for custom angles.
 */
export function AngleIllustration({ templateKey, angleKey, size, className, gender }: Props) {
  const preferred = useFigureGender();
  const style = gender ?? preferred;
  const photo = posePhoto(templateKey, angleKey, style);
  const xml = photo ? null : angleIllustration(templateKey, angleKey, style);
  if (!photo && !xml) return null;
  return (
    <View
      className={cn('overflow-hidden bg-[#F5F4F0]', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {photo ? (
        // Bundled example photo (not user data), so the default disk cache is fine.
        <Image
          source={photo.source}
          contentFit="cover"
          transition={0}
          style={{ width: size, height: size, transform: photo.mirror ? [{ scaleX: -1 }] : [] }}
        />
      ) : (
        <SvgXml xml={xml!} width={size} height={size} />
      )}
    </View>
  );
}

export function hasIllustration(templateKey: TemplateKey, angleKey: string) {
  return angleIllustration(templateKey, angleKey, 'neutral') !== null;
}
