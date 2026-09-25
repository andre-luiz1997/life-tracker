import { chartCoordinates, formatChange, parseDecimal, summarize } from './metrics';

describe('parseDecimal', () => {
  it.each([
    ['72,5', 72.5],
    ['72.5', 72.5],
    [' 80 ', 80],
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    ['-3,2', -3.2],
  ])('parses %s', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it('returns null when empty and NaN for garbage', () => {
    expect(parseDecimal('  ')).toBeNull();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3,4.5.6')).toBeNaN();
  });
});

describe('metric summaries', () => {
  const points = [
    { date: new Date(2026, 0, 1), value: 90 },
    { date: new Date(2026, 1, 1), value: 87.3 },
    { date: new Date(2026, 2, 1), value: 85.8 },
  ];

  it('summarizes first/last/min/max and change', () => {
    const s = summarize(points)!;
    expect(s.first.value).toBe(90);
    expect(s.last.value).toBe(85.8);
    expect(s.min).toBe(85.8);
    expect(s.max).toBe(90);
    expect(s.change).toBeCloseTo(-4.2);
    expect(summarize([])).toBeNull();
  });

  it('formats signed changes in the locale', () => {
    expect(formatChange(-4.2, 'kg', 'pt-BR')).toBe('−4,2 kg');
    expect(formatChange(1.5, 'cm', 'en')).toBe('+1.5 cm');
    expect(formatChange(0, 'kg', 'pt-BR')).toBe('0 kg');
  });

  it('maps points into the chart box', () => {
    const coords = chartCoordinates(points, 108, 108, 4);
    expect(coords[0]).toEqual({ x: 4, y: 4 }); // earliest, highest value → top-left
    expect(coords[2]!.x).toBe(104);
    expect(coords[2]!.y).toBe(104); // lowest value → bottom
  });

  it('centers degenerate series', () => {
    expect(chartCoordinates([points[0]!], 100, 50, 0)).toEqual([{ x: 50, y: 25 }]);
    const flat = chartCoordinates(
      points.map((p) => ({ ...p, value: 1 })),
      100,
      50,
      0,
    );
    expect(flat.every((c) => c.y === 25)).toBe(true);
  });
});
