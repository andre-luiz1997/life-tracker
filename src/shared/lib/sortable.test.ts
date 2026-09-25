import { moveTo, orderOf, positionsFrom, slotAt } from './sortable';

describe('sortable', () => {
  const start = positionsFrom(['a', 'b', 'c', 'd']);

  it('moves down, shifting the rows in between up', () => {
    expect(orderOf(moveTo(start, 'a', 2))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves up, shifting the rows in between down', () => {
    expect(orderOf(moveTo(start, 'd', 0))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('is a no-op for the same slot or unknown keys', () => {
    expect(moveTo(start, 'b', 1)).toBe(start);
    expect(moveTo(start, 'zzz', 0)).toBe(start);
  });

  it('keeps a valid permutation through a sequence of moves', () => {
    let p = start;
    for (const [key, to] of [
      ['a', 3],
      ['c', 0],
      ['a', 1],
      ['d', 3],
    ] as const)
      p = moveTo(p, key, to);
    expect(Object.values(p).sort()).toEqual([0, 1, 2, 3]);
  });

  it('maps a drag offset to a clamped slot', () => {
    expect(slotAt(-40, 72, 4)).toBe(0);
    expect(slotAt(100, 72, 4)).toBe(1);
    expect(slotAt(110, 72, 4)).toBe(2);
    expect(slotAt(9999, 72, 4)).toBe(3);
  });
});
