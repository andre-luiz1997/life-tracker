import { C, circle, dot, ellipse, line, shape } from './parts';

/** Large head views (200×200) shared by the hair and face templates. */

const cheek = (cx: number, cy: number, r = 7) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cheek}" opacity="0.7"/>`;

/** Neck + shoulders in the yellow top, cropped at the bottom edge. */
export const shouldersFront =
  shape('M84 150 L84 172 L116 172 L116 150 Z', C.skin) +
  shape('M30 204 C34 184 56 172 84 168 C92 176 108 176 116 168 C144 172 166 184 170 204 Z', C.top);

type Mouth = 'smile' | 'neutral';

export function faceFront({
  hair,
  mouth = 'smile',
}: {
  /** `back`: pulled back, hairline exposed. `fringe`: soft bangs. */
  hair: 'back' | 'fringe';
  mouth?: Mouth;
}) {
  const hairShape =
    hair === 'back'
      ? shape('M51 102 C42 26 158 26 149 102 C142 76 122 64 100 64 C78 64 58 76 51 102 Z', C.hair)
      : shape(
          'M50 104 C40 24 160 24 150 104 C144 86 134 76 120 72 C108 84 82 88 66 84 C58 90 53 96 50 104 Z',
          C.hair,
        );
  return (
    circle(100, 40, 20, C.hair) +
    shouldersFront +
    ellipse(50, 110, 9, 12, C.skin) +
    ellipse(150, 110, 9, 12, C.skin) +
    ellipse(100, 104, 50, 54, C.skin) +
    hairShape +
    line('M71 96 Q81 90 90 95', 3) +
    line('M110 95 Q119 90 129 96', 3) +
    dot(81, 111, 4.2) +
    dot(119, 111, 4.2) +
    line('M100 112 Q96 124 102 126', 2.6) +
    (mouth === 'smile' ? line('M88 138 Q100 147 112 138', 3) : line('M90 139 L110 139', 3)) +
    cheek(69, 128) +
    cheek(131, 128)
  );
}

/** Three-quarter view turned to the right (the subject's left side towards the camera). */
export function faceThreeQuarter({ hair }: { hair: 'back' | 'fringe' }) {
  const hairShape =
    hair === 'back'
      ? shape('M58 120 C38 40 128 22 154 88 C134 72 110 66 90 74 C76 82 64 100 58 120 Z', C.hair)
      : shape(
          'M56 122 C36 38 130 20 156 92 C136 80 124 76 112 76 C98 86 76 88 64 94 C60 104 58 112 56 122 Z',
          C.hair,
        );
  return (
    circle(70, 44, 20, C.hair) +
    shape('M88 150 L88 172 L118 172 L118 150 Z', C.skin) +
    shape(
      'M36 204 C40 184 62 172 88 168 C96 176 110 176 118 168 C146 172 166 184 170 204 Z',
      C.top,
    ) +
    ellipse(62, 112, 9, 12, C.skin) +
    shape(
      'M60 104 C60 70 84 50 108 50 C136 50 152 74 152 100 C154 108 160 116 154 122 C152 136 146 150 132 158 C118 166 96 164 82 154 C68 144 60 124 60 104 Z',
      C.skin,
    ) +
    hairShape +
    line('M96 96 Q105 91 112 95', 3) +
    line('M128 95 Q136 91 142 96', 3) +
    dot(104, 111, 4.2) +
    dot(136, 110, 3.8) +
    line('M140 110 Q148 121 141 125', 2.6) +
    line('M112 139 Q124 146 136 137', 3) +
    cheek(96, 128)
  );
}

/** Profile facing right. */
export function faceProfile({ hair }: { hair: 'back' | 'fringe' }) {
  return (
    circle(52, 56, 20, C.hair) +
    shape('M82 148 L82 172 L112 172 L112 148 Z', C.skin) +
    shape(
      'M40 204 C44 184 62 172 82 168 C92 176 104 176 112 168 C140 172 160 184 166 204 Z',
      C.top,
    ) +
    shape(
      'M54 104 C54 68 78 50 104 50 C130 50 146 70 148 94 C150 100 160 110 156 116 C152 118 150 118 150 120 C152 124 150 128 148 130 C150 134 148 138 144 140 C142 150 134 156 122 158 C104 162 84 156 70 144 C58 134 54 120 54 104 Z',
      C.skin,
    ) +
    shape(
      hair === 'back'
        ? 'M56 124 C34 50 100 22 146 74 C126 66 102 66 86 76 C76 86 70 104 68 124 Z'
        : 'M56 126 C34 50 104 20 150 82 C130 76 116 78 104 84 C90 88 76 96 68 110 C64 116 60 120 56 126 Z',
      C.hair,
    ) +
    ellipse(74, 114, 9, 12, C.skin) +
    line('M120 95 Q128 91 136 95', 3) +
    dot(130, 109, 4.2) +
    line('M128 144 Q136 147 142 142', 3) +
    cheek(118, 128)
  );
}

/** Seen from above: hair, ears and shoulders; nose tip towards the bottom. */
export function headTop({ part, whorl }: { part?: boolean; whorl?: boolean }) {
  return (
    ellipse(100, 128, 90, 58, C.top) +
    ellipse(44, 108, 9, 13, C.skin) +
    ellipse(156, 108, 9, 13, C.skin) +
    shape('M92 160 C92 170 108 170 108 160 Z', C.skin) +
    circle(100, 104, 56, C.hair) +
    (part ? line('M100 50 L100 158', 3.5, '#6b6b6b') : '') +
    (whorl
      ? line(
          'M104 84 C100 82 98 86 100 89 C103 93 110 90 110 84 C110 76 100 72 94 78 C86 86 90 100 102 100',
          3,
          '#6b6b6b',
        )
      : '')
  );
}

/** Back of the head: hair up in a bun, nape and shoulders visible. */
export function headBack() {
  return (
    shape('M80 132 L80 176 L120 176 L120 132 Z', C.skin) +
    shape(
      'M28 204 C32 184 56 172 80 168 C92 174 108 174 120 168 C144 172 168 184 172 204 Z',
      C.top,
    ) +
    ellipse(48, 100, 9, 13, C.skin) +
    ellipse(152, 100, 9, 13, C.skin) +
    circle(100, 92, 52, C.hair) +
    circle(100, 36, 20, C.hair) +
    line('M78 60 Q96 72 98 136', 2.4, '#4a4a4a') +
    line('M122 60 Q104 72 102 136', 2.4, '#4a4a4a') +
    // Short hairs at the nape.
    line('M86 140 L85 146', 2) +
    line('M94 142 L94 149', 2) +
    line('M106 142 L106 149', 2) +
    line('M114 140 L115 146', 2)
  );
}

/** Dashed ring used to point at a region (temple, nape, treated area). */
export const focus = (cx: number, cy: number, r: number, over: 'skin' | 'hair' = 'skin') =>
  over === 'hair'
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.accent}" stroke-width="4" stroke-dasharray="7 6"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.accent}" fill-opacity="0.35" stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="5 6"/>`;
