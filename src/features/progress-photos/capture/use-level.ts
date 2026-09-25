import { DeviceMotion } from 'expo-sensors';
import { useEffect, useEffectEvent, useState } from 'react';

import { type LevelReading, type LevelTarget, readLevel } from './level';

const UPDATE_INTERVAL_MS = 50;
/** UI refresh limits: every sample still reaches `onSample`, but re-renders are throttled. */
const UI_MIN_INTERVAL_MS = 150;
const UI_MIN_DELTA_DEG = 0.5;

/**
 * Live level reading from the gravity vector. Returns null until the first sample arrives or
 * when the sensor is unavailable. `onSample` runs for every sample (for the hands-free loop).
 */
export function useLevel(
  target: LevelTarget,
  {
    enabled = true,
    onSample,
  }: { enabled?: boolean; onSample?: (r: LevelReading, t: number) => void } = {},
): LevelReading | null {
  const [reading, setReading] = useState<LevelReading | null>(null);
  // Stable wrapper: changing `onSample` must not resubscribe to the sensor.
  const handleSample = useEffectEvent((r: LevelReading, t: number) => onSample?.(r, t));

  useEffect(() => {
    if (!enabled) return;
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;
    let lastUi = { at: 0, deviation: Number.NaN };

    DeviceMotion.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = DeviceMotion.addListener((motion) => {
        // Android may deliver the first events without every key.
        const gravity = motion.accelerationIncludingGravity;
        if (!gravity) return;
        const next = readLevel(gravity, target);
        if (!next) return;
        const now = Date.now();
        handleSample(next, now);
        const changed = !(Math.abs(next.deviation - lastUi.deviation) < UI_MIN_DELTA_DEG);
        if (changed && now - lastUi.at >= UI_MIN_INTERVAL_MS) {
          lastUi = { at: now, deviation: next.deviation };
          setReading(next);
        }
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [target, enabled]);

  return reading;
}
