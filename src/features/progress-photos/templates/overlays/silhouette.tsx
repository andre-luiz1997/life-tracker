import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import type { OverlayKey } from '../types';

/**
 * Framing guides drawn over the camera preview. Simple geometric outlines — the goal is
 * consistent framing between sessions, not anatomy. All shapes share a 100×160 box
 * (portrait); the Svg scales them to the preview with `xMidYMid meet`.
 */
const shapes: Record<OverlayKey, () => React.ReactNode> = {
  'body-front': () => (
    <>
      <Circle cx={50} cy={16} r={9} />
      <Path d="M41 30 Q50 34 59 30 L72 36 Q76 38 76 44 L80 82 M28 82 L24 44 Q24 38 28 36 L41 30" />
      <Path d="M34 38 L36 80 L34 100 L38 150 M66 38 L64 80 L66 100 L62 150" />
      <Path d="M36 100 Q50 104 64 100 M50 104 L50 150" />
    </>
  ),
  'body-back': () => (
    <>
      <Circle cx={50} cy={16} r={9} />
      <Path d="M41 30 Q50 32 59 30 L72 36 Q76 38 76 44 L80 82 M28 82 L24 44 Q24 38 28 36 L41 30" />
      <Path d="M34 38 L36 80 L34 100 L38 150 M66 38 L64 80 L66 100 L62 150" />
      <Path d="M50 32 L50 92 M36 96 Q43 106 50 98 Q57 106 64 96 M50 104 L50 150" />
    </>
  ),
  'body-side': () => (
    <>
      <Circle cx={48} cy={16} r={9} />
      <Path d="M46 25 L46 32 Q38 36 38 48 Q37 62 40 76 Q38 88 42 100 L44 150" />
      <Path d="M50 25 L52 32 Q60 38 60 50 Q62 64 58 78 Q62 90 56 100 L54 150" />
      <Path d="M49 38 L50 64 L52 84" />
    </>
  ),
  'body-torso': () => (
    <>
      <Path d="M30 20 Q50 28 70 20 L78 30 L74 70 Q72 100 70 130 L30 130 Q28 100 26 70 L22 30 Z" />
      <Line x1={50} y1={32} x2={50} y2={120} />
      <Ellipse cx={50} cy={92} rx={2} ry={3} />
    </>
  ),
  'body-arms': () => (
    <>
      <Path d="M20 110 L36 70 Q40 58 52 56 L74 50 Q84 48 84 38 Q84 26 74 26 Q66 26 64 36" />
      <Path d="M28 124 L46 84 Q50 76 60 74 L78 68 Q94 62 94 40 Q94 16 74 14 Q58 14 54 32" />
    </>
  ),
  'body-legs': () => (
    <>
      <Path d="M28 10 Q50 16 72 10 L70 60 L66 100 L64 150 M28 10 L30 60 L34 100 L36 150" />
      <Path d="M50 22 L48 60 L46 100 L46 150 M50 22 L52 60 L54 100 L54 150" />
    </>
  ),
  'head-front': () => (
    <>
      <Ellipse cx={50} cy={80} rx={32} ry={44} />
      <Path d="M24 58 Q50 30 76 58" strokeDasharray="2 3" />
      <Line x1={22} y1={72} x2={78} y2={72} />
    </>
  ),
  'head-temple': () => (
    <>
      <Ellipse cx={52} cy={80} rx={30} ry={44} />
      <Path d="M30 62 Q42 38 64 40" strokeDasharray="2 3" />
      <Circle cx={36} cy={64} r={8} strokeDasharray="2 3" />
      <Line x1={22} y1={72} x2={78} y2={72} />
    </>
  ),
  'head-top': () => (
    <>
      <Ellipse cx={50} cy={80} rx={36} ry={44} />
      <Circle cx={50} cy={90} r={12} strokeDasharray="2 3" />
      <Line x1={50} y1={40} x2={50} y2={120} strokeDasharray="1 4" />
      <Line x1={18} y1={80} x2={82} y2={80} strokeDasharray="1 4" />
    </>
  ),
  'head-back': () => (
    <>
      <Path d="M18 76 Q18 30 50 30 Q82 30 82 76 Q82 104 68 116 L66 146 M18 76 Q18 104 32 116 L34 146" />
      <Path d="M30 112 Q50 120 70 112" strokeDasharray="2 3" />
    </>
  ),
  'face-front': () => (
    <>
      <Ellipse cx={50} cy={78} rx={30} ry={42} />
      <Line x1={30} y1={70} x2={42} y2={70} />
      <Line x1={58} y1={70} x2={70} y2={70} />
      <Line x1={50} y1={70} x2={50} y2={92} strokeDasharray="1 4" />
      <Line x1={42} y1={120} x2={58} y2={120} />
    </>
  ),
  'face-45': () => (
    <>
      <Ellipse cx={52} cy={78} rx={27} ry={42} />
      <Line x1={36} y1={70} x2={44} y2={70} />
      <Line x1={56} y1={70} x2={68} y2={70} />
      <Path d="M44 72 L38 92 L46 94" />
      <Line x1={40} y1={118} x2={54} y2={120} />
    </>
  ),
  'face-profile': () => (
    <Path d="M62 36 Q30 34 28 70 L20 88 L28 92 L27 100 Q26 108 32 110 L30 118 Q36 124 48 122 L50 140 M62 36 Q84 44 82 80 Q80 104 66 112 L68 140" />
  ),
};

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
        {shapes[overlay]()}
      </G>
    </Svg>
  );
}
