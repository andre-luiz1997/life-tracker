import { bytesToHex, hexToBytes, timingSafeEqual } from './bytes';

describe('bytes', () => {
  it('round-trips hex', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    expect(bytesToHex(bytes)).toBe('00017f80ff');
    expect(hexToBytes('00017f80ff')).toEqual(bytes);
  });

  it('rejects invalid hex', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });

  it('compares in constant time', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
  });
});
