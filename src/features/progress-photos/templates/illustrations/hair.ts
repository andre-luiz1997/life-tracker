import type { FigureGender } from './character';
import { faceFront, faceThreeQuarter, focus, headBack, headTop } from './heads';
import { dashed, mirror, phone } from './parts';

/** Hair treatment angles. Views the user can't see show where to hold the phone. */
export const hairIllustrations: Record<string, (g: FigureGender) => string> = {
  // Hair pulled back, hairline exposed.
  hairline: (g) => faceFront({ gender: g }) + focus(100, 72, 26, 'hair'),
  temple_left: (g) => faceThreeQuarter({ gender: g }) + focus(80, 80, 22, 'hair'),
  temple_right: (g) => mirror(faceThreeQuarter({ gender: g }) + focus(80, 80, 22, 'hair')),
  // Seen from above with the center part; phone held flat over the head.
  mid_scalp: (g) =>
    headTop({ gender: g, part: true }) +
    dashed('M164 44 L128 72') +
    phone(172, 32, 0, 1.3) +
    focus(100, 104, 26, 'hair'),
  crown: (g) =>
    headTop({ gender: g, whorl: true }) +
    dashed('M164 44 L126 72') +
    phone(172, 32, 0, 1.3) +
    focus(102, 88, 26, 'hair'),
  // Back of the head; phone behind, pointing at the nape.
  nape: (g) =>
    headBack({ gender: g }) +
    focus(100, 140, 24, 'hair') +
    dashed('M156 170 L126 150') +
    phone(168, 178, -35, 1.2),
};
