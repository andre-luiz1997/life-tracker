import { Image } from 'expo-image';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { useThumbnail } from '../hooks/use-photo-source';

type PhotoThumbProps = {
  thumbFileName: string | null | undefined;
  className?: string;
  size?: number;
};

/** Encrypted thumbnail, decrypted in memory. Never written to expo-image's disk cache. */
export function PhotoThumb({ thumbFileName, className, size = 56 }: PhotoThumbProps) {
  const uri = useThumbnail(thumbFileName);
  return (
    <View
      className={cn('overflow-hidden rounded-lg bg-surface-muted', className)}
      style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          cachePolicy="none"
          contentFit="cover"
          style={{ width: size, height: size }}
        />
      ) : null}
    </View>
  );
}
