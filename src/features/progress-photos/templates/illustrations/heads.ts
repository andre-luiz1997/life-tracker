import { builds, type FigureGender } from './character';
import { C, circle, dot, ellipse, line, shape } from './parts';

/** Large head views (200×200) shared by the hair and face templates. */

const cheek = (cx: number, cy: number, r = 7) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cheek}" opacity="0.7"/>`;

type Mouth = 'smile' | 'neutral';

const style = (g: FigureGender) => builds[g];

/** Neck + shoulders in the top color, cropped at the bottom edge. */
const shoulders = (g: FigureGender, dx = 0) => {
  const w = g === 'masculine' ? 8 : 0; // broader shoulders
  return (
    shape(`M${84 + dx} 150 L${84 + dx} 172 L${116 + dx} 172 L${116 + dx} 150 Z`, C.skin) +
    shape(
      `M${30 - w + dx} 204 C${34 - w + dx} 184 ${56 - w + dx} 172 ${84 + dx} 168 C${92 + dx} 176 ${108 + dx} 176 ${116 + dx} 168 C${144 + w + dx} 172 ${166 + w + dx} 184 ${170 + w + dx} 204 Z`,
      style(g).topColor,
    )
  );
};

const brows = (g: FigureGender, left: string, right: string) => {
  const w = style(g).brows >= 3 ? 4.2 : 3;
  return line(left, w) + line(right, w);
};

/**
 * Hair seen from the front. `pulledBack`: forehead fully visible (hairline shots). Masculine short
 * hair shows the temple corners (where recession appears).
 */
function frontHair(g: FigureGender, pulledBack: boolean) {
  const kind = style(g).hair;
  if (kind === 'bun') {
    return (
      circle(100, 40, 20, C.hair) +
      (pulledBack
        ? shape('M51 102 C42 26 158 26 149 102 C142 76 122 64 100 64 C78 64 58 76 51 102 Z', C.hair)
        : shape(
            'M50 104 C40 24 160 24 150 104 C144 86 134 76 120 72 C108 84 82 88 66 84 C58 90 53 96 50 104 Z',
            C.hair,
          ))
    );
  }
  if (kind === 'short') {
    return shape(
      'M52 98 C44 26 156 26 148 98 C145 86 140 76 131 71 C122 73 112 66 100 66 C88 66 78 73 69 71 C60 76 55 86 52 98 Z',
      C.hair,
    );
  }
  return pulledBack
    ? shape('M51 100 C42 24 158 24 149 100 C143 80 124 66 100 66 C76 66 57 80 51 100 Z', C.hair)
    : shape(
        'M50 102 C40 22 160 22 150 102 C146 88 138 78 126 74 C116 82 100 82 90 76 C80 82 64 84 56 88 C53 92 51 97 50 102 Z',
        C.hair,
      );
}

export function faceFront({
  gender,
  pulledBack = true,
  mouth = 'smile',
}: {
  gender: FigureGender;
  pulledBack?: boolean;
  mouth?: Mouth;
}) {
  const s = style(gender);
  return (
    shoulders(gender) +
    ellipse(50, 110, 9, 12, C.skin) +
    ellipse(150, 110, 9, 12, C.skin) +
    ellipse(100, 104, gender === 'masculine' ? 51 : 50, 54, C.skin) +
    frontHair(gender, pulledBack) +
    brows(gender, 'M71 96 Q81 90 90 95', 'M110 95 Q119 90 129 96') +
    dot(81, 111, 4.2) +
    dot(119, 111, 4.2) +
    line('M100 112 Q96 124 102 126', 2.6) +
    (mouth === 'smile' ? line('M88 138 Q100 147 112 138', 3) : line('M90 139 L110 139', 3)) +
    (s.blush ? cheek(69, 128) + cheek(131, 128) : '')
  );
}

/** Three-quarter view turned to the right (the subject's left side towards the camera). */
export function faceThreeQuarter({ gender }: { gender: FigureGender }) {
  const s = style(gender);
  const hair = {
    bun:
      circle(70, 44, 20, C.hair) +
      shape('M58 120 C38 40 128 22 154 88 C134 72 110 66 90 74 C76 82 64 100 58 120 Z', C.hair),
    short: shape(
      'M60 112 C44 42 126 26 152 84 C146 78 138 74 130 74 C120 70 106 68 94 72 C80 78 66 94 60 112 Z',
      C.hair,
    ),
    crop: shape(
      'M58 118 C38 38 130 20 156 90 C146 82 136 78 126 78 C114 84 98 82 88 78 C76 86 66 100 58 118 Z',
      C.hair,
    ),
  }[s.hair];
  return (
    shoulders(gender, 4) +
    ellipse(62, 112, 9, 12, C.skin) +
    shape(
      'M60 104 C60 70 84 50 108 50 C136 50 152 74 152 100 C154 108 160 116 154 122 C152 136 146 150 132 158 C118 166 96 164 82 154 C68 144 60 124 60 104 Z',
      C.skin,
    ) +
    hair +
    brows(gender, 'M96 96 Q105 91 112 95', 'M128 95 Q136 91 142 96') +
    dot(104, 111, 4.2) +
    dot(136, 110, 3.8) +
    line('M140 110 Q148 121 141 125', 2.6) +
    line('M112 139 Q124 146 136 137', 3) +
    (s.blush ? cheek(96, 128) : '')
  );
}

/** Profile facing right. */
export function faceProfile({ gender }: { gender: FigureGender }) {
  const s = style(gender);
  const hair = {
    bun:
      circle(52, 56, 20, C.hair) +
      shape('M56 124 C34 50 100 22 146 74 C126 66 102 66 86 76 C76 86 70 104 68 124 Z', C.hair),
    short: shape(
      'M58 118 C38 52 100 26 144 70 C134 70 120 70 108 72 C94 74 82 80 74 92 C70 100 66 110 64 118 Z',
      C.hair,
    ),
    crop: shape(
      'M56 124 C34 50 104 20 150 82 C130 76 116 78 104 84 C90 88 76 96 68 110 C64 116 60 120 56 124 Z',
      C.hair,
    ),
  }[s.hair];
  return (
    shoulders(gender, -2) +
    shape(
      'M54 104 C54 68 78 50 104 50 C130 50 146 70 148 94 C150 100 160 110 156 116 C152 118 150 118 150 120 C152 124 150 128 148 130 C150 134 148 138 144 140 C142 150 134 156 122 158 C104 162 84 156 70 144 C58 134 54 120 54 104 Z',
      C.skin,
    ) +
    hair +
    ellipse(74, 114, 9, 12, C.skin) +
    line('M120 95 Q128 91 136 95', s.brows >= 3 ? 4.2 : 3) +
    dot(130, 109, 4.2) +
    line('M128 144 Q136 147 142 142', 3) +
    (s.blush ? cheek(118, 128) : '')
  );
}

/** Seen from above: hair, ears and shoulders; nose tip towards the bottom. */
export function headTop({
  gender,
  part,
  whorl,
}: {
  gender: FigureGender;
  part?: boolean;
  whorl?: boolean;
}) {
  const s = style(gender);
  return (
    ellipse(100, 128, gender === 'masculine' ? 96 : 90, 58, s.topColor) +
    ellipse(44, 108, 9, 13, C.skin) +
    ellipse(156, 108, 9, 13, C.skin) +
    shape('M92 160 C92 170 108 170 108 160 Z', C.skin) +
    circle(100, 104, 56, C.hair) +
    // Bun at the back of the head (top of the image, since we look from above).
    (s.hair === 'bun' ? circle(100, 52, 16, C.hair) : '') +
    (part ? line('M100 58 L100 158', 3.5, '#6b6b6b') : '') +
    (whorl
      ? line(
          'M104 84 C100 82 98 86 100 89 C103 93 110 90 110 84 C110 76 100 72 94 78 C86 86 90 100 102 100',
          3,
          '#6b6b6b',
        )
      : '')
  );
}

/** Back of the head, nape and shoulders visible. */
export function headBack({ gender }: { gender: FigureGender }) {
  const s = style(gender);
  const w = gender === 'masculine' ? 8 : 0;
  const base =
    shape('M80 132 L80 176 L120 176 L120 132 Z', C.skin) +
    shape(
      `M${28 - w} 204 C${32 - w} 184 ${56 - w} 172 80 168 C92 174 108 174 120 168 C${144 + w} 172 ${168 + w} 184 ${172 + w} 204 Z`,
      s.topColor,
    ) +
    ellipse(48, 100, 9, 13, C.skin) +
    ellipse(152, 100, 9, 13, C.skin);
  if (s.hair === 'bun') {
    return (
      base +
      circle(100, 92, 52, C.hair) +
      circle(100, 36, 20, C.hair) +
      line('M78 60 Q96 72 98 136', 2.4, '#4a4a4a') +
      line('M122 60 Q104 72 102 136', 2.4, '#4a4a4a') +
      line('M86 140 L85 146', 2) +
      line('M94 142 L94 149', 2) +
      line('M106 142 L106 149', 2) +
      line('M114 140 L115 146', 2)
    );
  }
  // Short hair: skull shape with a tapered nape line.
  const nape = s.hair === 'short' ? 130 : 138;
  return (
    base +
    circle(100, 92, 52, C.skin) +
    shape(
      `M46 96 C40 18 160 18 154 96 C152 112 144 124 132 ${nape - 6} C120 ${nape} 110 ${nape + 4} 100 ${nape + 2} C90 ${nape + 4} 80 ${nape} 68 ${nape - 6} C56 124 49 112 48 96 Z`,
      C.hair,
    ) +
    line(`M84 ${nape - 2} L83 ${nape + 4}`, 2) +
    line(`M100 ${nape - 1} L100 ${nape + 6}`, 2) +
    line(`M116 ${nape - 2} L117 ${nape + 4}`, 2)
  );
}

/** Dashed ring used to point at a region (temple, nape, treated area). */
export const focus = (cx: number, cy: number, r: number, over: 'skin' | 'hair' = 'skin') =>
  over === 'hair'
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.accent}" stroke-width="4" stroke-dasharray="7 6"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.accent}" fill-opacity="0.35" stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="5 6"/>`;
