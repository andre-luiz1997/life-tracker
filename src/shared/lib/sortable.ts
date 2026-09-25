/** Map of item key → current slot index. Mutated immutably while dragging (worklet-safe). */
export type Positions = Record<string, number>;

export function positionsFrom(keys: string[]): Positions {
  'worklet';
  const out: Positions = {};
  keys.forEach((key, i) => {
    out[key] = i;
  });
  return out;
}

/** Slot under a dragged row whose top edge is at `top`, clamped to the list. */
export function slotAt(top: number, rowHeight: number, count: number): number {
  'worklet';
  return Math.max(0, Math.min(count - 1, Math.round(top / rowHeight)));
}

/**
 * Moves `key` to slot `to`, shifting the rows in between by one (like a list insert),
 * so dragging past several rows at once keeps a consistent order.
 */
export function moveTo(positions: Positions, key: string, to: number): Positions {
  'worklet';
  const from = positions[key];
  if (from === undefined || from === to) return positions;
  const out: Positions = {};
  for (const k in positions) {
    const p = positions[k]!;
    if (k === key) out[k] = to;
    else if (from < to && p > from && p <= to) out[k] = p - 1;
    else if (from > to && p >= to && p < from) out[k] = p + 1;
    else out[k] = p;
  }
  return out;
}

export function orderOf(positions: Positions): string[] {
  'worklet';
  return Object.keys(positions).sort((a, b) => positions[a]! - positions[b]!);
}
