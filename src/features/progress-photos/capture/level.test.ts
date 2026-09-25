import { readLevel } from './level';

const G = 9.81;
const rad = (deg: number) => (deg * Math.PI) / 180;

describe('readLevel', () => {
  describe('flat', () => {
    it('is level when gravity is along z (either face)', () => {
      expect(readLevel({ x: 0, y: 0, z: -G }, 'flat')!.deviation).toBeCloseTo(0);
      expect(readLevel({ x: 0, y: 0, z: G }, 'flat')!.deviation).toBeCloseTo(0);
    });

    it('measures the tilt from horizontal', () => {
      const g = { x: G * Math.sin(rad(10)), y: 0, z: -G * Math.cos(rad(10)) };
      const reading = readLevel(g, 'flat')!;
      expect(reading.deviation).toBeCloseTo(10);
      expect(reading.offsetX).toBeCloseTo(10);
      expect(reading.offsetY).toBeCloseTo(0);
    });

    it('reports 90° when the phone is upright', () => {
      expect(readLevel({ x: 0, y: -G, z: 0 }, 'flat')!.deviation).toBeCloseTo(90);
    });
  });

  describe('upright', () => {
    it('is level in portrait', () => {
      const reading = readLevel({ x: 0, y: -G, z: 0 }, 'upright')!;
      expect(reading.deviation).toBeCloseTo(0);
      expect(reading.offsetX).toBeCloseTo(0);
    });

    it('measures roll (rotation around the screen normal)', () => {
      const g = { x: G * Math.sin(rad(5)), y: -G * Math.cos(rad(5)), z: 0 };
      const reading = readLevel(g, 'upright')!;
      expect(reading.deviation).toBeCloseTo(5);
      expect(reading.offsetX).toBeCloseTo(5);
    });

    it('measures pitch (leaning forward/back)', () => {
      const g = { x: 0, y: -G * Math.cos(rad(15)), z: G * Math.sin(rad(15)) };
      const reading = readLevel(g, 'upright')!;
      expect(reading.deviation).toBeCloseTo(15);
      expect(reading.offsetY).toBeCloseTo(15);
    });
  });

  it('ignores invalid readings', () => {
    expect(readLevel({ x: 0, y: 0, z: 0 }, 'flat')).toBeNull();
    expect(readLevel({ x: NaN, y: 0, z: 1 }, 'flat')).toBeNull();
  });
});
