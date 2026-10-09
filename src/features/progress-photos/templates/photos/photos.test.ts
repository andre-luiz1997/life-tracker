import { posePhoto } from '.';

describe('pose photos', () => {
  const files = {
    'face/profile_left/feminine': 1,
    'weight_loss/body_front/masculine': 2,
  };

  it('finds the photo for the angle and style', () => {
    expect(posePhoto('weight_loss', 'body_front', 'masculine', files)).toEqual({
      source: 2,
      mirror: false,
    });
  });

  it('mirrors the left photo for right-hand variants', () => {
    expect(posePhoto('face', 'profile_right', 'feminine', files)).toEqual({
      source: 1,
      mirror: true,
    });
  });

  it('returns null when no photo was imported', () => {
    expect(posePhoto('weight_loss', 'body_front', 'neutral', files)).toBeNull();
    expect(posePhoto('custom', 'main', 'neutral', files)).toBeNull();
  });
});
