import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Text } from '@/shared/ui';

import { useFullPhoto } from '../../hooks/use-photo-source';
import type { LevelReading } from '../level';

const LEVEL_OK_DEG = 3;
const BUBBLE_RANGE_DEG = 20;

/** Rule-of-thirds grid. */
export function GridOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[1, 2].map((i) => (
        <View
          key={`v${i}`}
          className="absolute bottom-0 top-0 w-px bg-white/40"
          style={{ left: `${(i * 100) / 3}%` }}
        />
      ))}
      {[1, 2].map((i) => (
        <View
          key={`h${i}`}
          className="absolute left-0 right-0 h-px bg-white/40"
          style={{ top: `${(i * 100) / 3}%` }}
        />
      ))}
    </View>
  );
}

/**
 * Previous photo of the same angle, semi-transparent, to match framing. Front-camera previews
 * are mirrored while stored photos aren't, so the ghost is mirrored to line up with the preview.
 */
export function GhostOverlay({
  fileName,
  opacity,
  mirror,
}: {
  fileName: string;
  opacity: number;
  mirror: boolean;
}) {
  const uri = useFullPhoto(fileName);
  if (!uri) return null;
  return (
    <Image
      source={{ uri }}
      cachePolicy="none"
      contentFit="cover"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity }, mirror && { transform: [{ scaleX: -1 }] }]}
    />
  );
}

/** Bubble level: the dot moves with the tilt and turns green when level. */
export function LevelIndicator({ reading }: { reading: LevelReading | null }) {
  const { t } = useTranslation('photos');
  if (!reading) return null;
  const ok = reading.deviation <= LEVEL_OK_DEG;
  const clamp = (deg: number) => Math.max(-1, Math.min(1, deg / BUBBLE_RANGE_DEG));
  const size = 72;
  const dot = 16;
  const x = (clamp(reading.offsetX) * (size - dot)) / 2;
  const y = (clamp(reading.offsetY) * (size - dot)) / 2;

  return (
    <View
      pointerEvents="none"
      className="items-center gap-1"
      accessibilityLiveRegion="polite"
      accessibilityLabel={ok ? t('capture.levelOk') : `${Math.round(reading.deviation)}°`}>
      <View
        className="items-center justify-center rounded-full border-2 border-white/70"
        style={{ width: size, height: size }}>
        <View className="h-4 w-4 rounded-full border border-white/60" />
        <View
          className={ok ? 'absolute rounded-full bg-green-400' : 'absolute rounded-full bg-white'}
          style={{ width: dot, height: dot, transform: [{ translateX: x }, { translateY: y }] }}
        />
      </View>
      <Text className="text-xs font-semibold text-white">
        {ok ? t('capture.levelOk') : `${Math.round(reading.deviation)}°`}
      </Text>
    </View>
  );
}
