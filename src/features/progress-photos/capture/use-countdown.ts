import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown for timer shots: calls `onTick(remaining)` every second and `onDone()` at zero.
 * Returns the remaining seconds (null when idle) plus start/cancel.
 */
export function useCountdown({
  onTick,
  onDone,
}: {
  onTick?: (remaining: number) => void;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacks = useRef({ onTick, onDone });

  useEffect(() => {
    callbacks.current = { onTick, onDone };
  });

  const cancel = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRemaining(null);
  }, []);

  const start = useCallback(
    (seconds: number) => {
      cancel();
      let left = seconds;
      setRemaining(left);
      callbacks.current.onTick?.(left);
      timer.current = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          cancel();
          callbacks.current.onDone();
          return;
        }
        setRemaining(left);
        callbacks.current.onTick?.(left);
      }, 1000);
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { remaining, start, cancel };
}
