import { detail } from './body';
import type { FigureGender } from './character';
import { faceFront, faceProfile, faceThreeQuarter, focus } from './heads';
import { mirror } from './parts';

/** Facial treatment angles: neutral expression, hair tied back. */
export const faceIllustrations: Record<string, (g: FigureGender) => string> = {
  face_front: (g) => faceFront({ gender: g, mouth: 'neutral' }),
  face_45_left: (g) => faceThreeQuarter({ gender: g }),
  face_45_right: (g) => mirror(faceThreeQuarter({ gender: g })),
  profile_left: (g) => faceProfile({ gender: g }),
  profile_right: (g) => mirror(faceProfile({ gender: g })),
  // Zoomed on the cheek with the treated area highlighted.
  closeup: (g) =>
    detail(faceFront({ gender: g, mouth: 'neutral' }) + focus(126, 124, 16), 116, 1.45),
};
