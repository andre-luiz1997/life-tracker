import { faceFront, faceThreeQuarter, focus, headBack, headTop } from './heads';
import { dashed, mirror, phone } from './parts';

/** Hair treatment angles. Views the user can't see show where to hold the phone. */
export const hairIllustrations = {
  // Hair pulled back, hairline exposed.
  hairline: () => faceFront({ hair: 'back' }) + focus(100, 72, 26, 'hair'),
  temple_left: () => faceThreeQuarter({ hair: 'back' }) + focus(80, 80, 22, 'hair'),
  temple_right: () => mirror(faceThreeQuarter({ hair: 'back' }) + focus(80, 80, 22, 'hair')),
  // Seen from above with the center part; phone held flat over the head.
  mid_scalp: () =>
    headTop({ part: true }) +
    dashed('M164 44 L128 72') +
    phone(172, 32, 0, 1.3) +
    focus(100, 104, 26, 'hair'),
  crown: () =>
    headTop({ whorl: true }) +
    dashed('M164 44 L126 72') +
    phone(172, 32, 0, 1.3) +
    focus(102, 88, 26, 'hair'),
  // Back of the head; phone behind, pointing at the nape.
  nape: () =>
    headBack() +
    focus(100, 140, 24, 'hair') +
    dashed('M156 170 L126 150') +
    phone(168, 178, -35, 1.2),
};
