/**
 * Hands-free capture (crown/nape): the user can't see the screen, so the level is conveyed by
 * haptic pulses — the closer to level, the faster they get. Once the phone stays level for
 * `holdMs`, the machine fires (the caller takes a burst). Pure and time-injected for testing.
 *
 * Thresholds need calibration on real devices (docs/PLANO-MVP.md §10.5).
 */
export type HandsFreeConfig = {
  /** Deviation (°) at which the phone counts as level. */
  alignedDeg: number;
  /** Deviation (°) that breaks alignment; > alignedDeg for hysteresis against jitter. */
  releaseDeg: number;
  /** Time the phone must stay level before firing. */
  holdMs: number;
  /** Pulse interval at level and at `maxFeedbackDeg` (and beyond). */
  minPulseMs: number;
  maxPulseMs: number;
  maxFeedbackDeg: number;
};

export const DEFAULT_HANDS_FREE_CONFIG: HandsFreeConfig = {
  alignedDeg: 4,
  releaseDeg: 7,
  holdMs: 1000,
  minPulseMs: 120,
  maxPulseMs: 900,
  maxFeedbackDeg: 35,
};

export type HandsFreeState =
  | { phase: 'searching'; lastPulseAt: number | null }
  | { phase: 'holding'; since: number; lastPulseAt: number }
  | { phase: 'fired' };

export type HandsFreeStep = {
  state: HandsFreeState;
  /** Haptic to play now: `soft` while searching, `strong` when alignment is reached. */
  pulse: 'soft' | 'strong' | null;
  fire: boolean;
};

export const initialHandsFreeState: HandsFreeState = { phase: 'searching', lastPulseAt: null };

export function pulseInterval(deviation: number, c: HandsFreeConfig): number {
  const ratio = Math.min(1, Math.max(0, deviation / c.maxFeedbackDeg));
  return Math.round(c.minPulseMs + ratio * (c.maxPulseMs - c.minPulseMs));
}

export function stepHandsFree(
  state: HandsFreeState,
  deviation: number,
  now: number,
  c: HandsFreeConfig = DEFAULT_HANDS_FREE_CONFIG,
): HandsFreeStep {
  switch (state.phase) {
    case 'fired':
      return { state, pulse: null, fire: false };

    case 'searching': {
      if (deviation <= c.alignedDeg) {
        return {
          state: { phase: 'holding', since: now, lastPulseAt: now },
          pulse: 'strong',
          fire: false,
        };
      }
      const due =
        state.lastPulseAt === null || now - state.lastPulseAt >= pulseInterval(deviation, c);
      return due
        ? { state: { phase: 'searching', lastPulseAt: now }, pulse: 'soft', fire: false }
        : { state, pulse: null, fire: false };
    }

    case 'holding': {
      if (deviation > c.releaseDeg) {
        return {
          state: { phase: 'searching', lastPulseAt: state.lastPulseAt },
          pulse: null,
          fire: false,
        };
      }
      if (now - state.since >= c.holdMs) {
        return { state: { phase: 'fired' }, pulse: null, fire: true };
      }
      const due = now - state.lastPulseAt >= c.minPulseMs;
      return due
        ? { state: { ...state, lastPulseAt: now }, pulse: 'soft', fire: false }
        : { state, pulse: null, fire: false };
    }
  }
}
