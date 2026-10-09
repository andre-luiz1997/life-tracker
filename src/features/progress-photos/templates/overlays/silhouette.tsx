import Svg, { G, Path } from 'react-native-svg';

import type { OverlayKey } from '../types';
import { silhouettePaths } from './silhouette-paths';

/**
 * Framing guides drawn over the camera preview: the outline of the pose photo (see
 * scripts/pose-silhouettes.py), in a 100×160 box that the Svg scales with `xMidYMid meet`.
 * The goal is consistent framing between sessions; where the photo crops the body the outline
 * stays open and runs to the edge.
 */
type SilhouetteProps = {
  overlay: OverlayKey;
  mirror?: boolean;
  color?: string;
  opacity?: number;
};

export function Silhouette({
  overlay,
  mirror = false,
  color = '#ffffff',
  opacity = 0.8,
}: SilhouetteProps) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 160"
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}>
      <G
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3">
        <Path d={silhouettePaths[overlay]} />
      </G>
    </Svg>
  );
}
