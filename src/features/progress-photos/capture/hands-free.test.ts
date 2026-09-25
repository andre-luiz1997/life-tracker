import {
  DEFAULT_HANDS_FREE_CONFIG as C,
  type HandsFreeState,
  initialHandsFreeState,
  pulseInterval,
  stepHandsFree,
} from './hands-free';

/** Feeds (deviation, time) samples and collects the output. */
function run(
  samples: [deviation: number, t: number][],
  start: HandsFreeState = initialHandsFreeState,
) {
  let state = start;
  const pulses: [number, string][] = [];
  let firedAt: number | null = null;
  for (const [deviation, t] of samples) {
    const step = stepHandsFree(state, deviation, t);
    state = step.state;
    if (step.pulse) pulses.push([t, step.pulse]);
    if (step.fire) firedAt = t;
  }
  return { state, pulses, firedAt };
}

const every = (ms: number, from: number, to: number, deviation: number) =>
  Array.from(
    { length: Math.floor((to - from) / ms) + 1 },
    (_, i) => [deviation, from + i * ms] as [number, number],
  );

describe('hands-free capture', () => {
  it('pulses faster as the phone gets closer to level', () => {
    expect(pulseInterval(0, C)).toBe(C.minPulseMs);
    expect(pulseInterval(C.maxFeedbackDeg, C)).toBe(C.maxPulseMs);
    expect(pulseInterval(90, C)).toBe(C.maxPulseMs);
    expect(pulseInterval(10, C)).toBeLessThan(pulseInterval(20, C));
  });

  it('pulses at the deviation-based rate while searching', () => {
    const { pulses } = run(every(50, 0, 2000, 30));
    const interval = pulseInterval(30, C);
    expect(pulses.length).toBe(Math.floor(2000 / (Math.ceil(interval / 50) * 50)) + 1);
    expect(pulses.every(([, kind]) => kind === 'soft')).toBe(true);
  });

  it('fires after staying level for holdMs', () => {
    const { firedAt, pulses, state } = run([[20, 0], ...every(50, 100, 1200, 2)]);
    expect(pulses.find(([t]) => t === 100)?.[1]).toBe('strong');
    expect(firedAt).toBe(100 + C.holdMs);
    expect(state.phase).toBe('fired');
  });

  it('tolerates jitter within the release threshold (hysteresis)', () => {
    const samples = every(50, 0, 1100, 3).map(([, t], i) => [i % 2 ? 6 : 3, t] as [number, number]);
    expect(run(samples).firedAt).toBe(C.holdMs);
  });

  it('restarts the hold when the phone tilts away', () => {
    const { firedAt } = run([...every(50, 0, 800, 2), [15, 850], ...every(50, 900, 1500, 2)]);
    expect(firedAt).toBeNull();
    expect(run([...every(50, 0, 800, 2), [15, 850], ...every(50, 900, 2000, 2)]).firedAt).toBe(
      900 + C.holdMs,
    );
  });

  it('stays fired until reset', () => {
    const { pulses, firedAt } = run(every(50, 0, 1000, 20), { phase: 'fired' });
    expect(pulses).toHaveLength(0);
    expect(firedAt).toBeNull();
  });
});
