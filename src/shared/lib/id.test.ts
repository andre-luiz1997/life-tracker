import { uuidv7 } from './id';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidv7', () => {
  it('has the v7 format', () => {
    expect(uuidv7()).toMatch(UUID_V7);
  });

  it('encodes the timestamp in the first 48 bits', () => {
    const ts = 1_758_800_000_000;
    const hex = uuidv7(ts).replaceAll('-', '').slice(0, 12);
    expect(parseInt(hex, 16)).toBe(ts);
  });

  it('sorts by creation time', () => {
    const ids = [uuidv7(3000), uuidv7(1000), uuidv7(2000)];
    expect([...ids].sort()).toEqual([ids[1], ids[2], ids[0]]);
  });
});
