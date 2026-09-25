import { fitWithin } from './image-processing';

jest.mock('expo-image-manipulator', () => ({}));
jest.mock('expo-file-system', () => ({}));

describe('fitWithin', () => {
  it('keeps small images untouched', () => {
    expect(fitWithin(1080, 1920, 2560)).toBeNull();
  });

  it('limits the longest side', () => {
    expect(fitWithin(4000, 3000, 2560)).toEqual({ width: 2560, height: null });
    expect(fitWithin(3000, 4000, 2560)).toEqual({ width: null, height: 2560 });
    expect(fitWithin(4000, 4000, 400)).toEqual({ width: 400, height: null });
  });
});
