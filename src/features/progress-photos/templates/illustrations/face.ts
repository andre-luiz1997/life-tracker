import { detail } from './body';
import { faceFront, faceProfile, faceThreeQuarter, focus } from './heads';
import { mirror } from './parts';

/** Facial treatment angles: neutral expression, hair tied back. */
export const faceIllustrations = {
  face_front: () => faceFront({ hair: 'back', mouth: 'neutral' }),
  face_45_left: () => faceThreeQuarter({ hair: 'back' }),
  face_45_right: () => mirror(faceThreeQuarter({ hair: 'back' })),
  profile_left: () => faceProfile({ hair: 'back' }),
  profile_right: () => mirror(faceProfile({ hair: 'back' })),
  // Zoomed on the cheek with the treated area highlighted.
  closeup: () =>
    detail(faceFront({ hair: 'back', mouth: 'neutral' }) + focus(126, 124, 16), 116, 1.45),
};
