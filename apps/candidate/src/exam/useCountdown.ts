import { useEffect, useRef, useState } from 'react';

/**
 * A one-second countdown from `seconds`. Calls `onExpire` once when it reaches 0.
 * Uses chained timeouts (not a single interval) so each tick is independent and
 * test-friendly, and keeps `onExpire` in a ref so a changing callback never
 * restarts the clock.
 */
export function useCountdown(seconds: number, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  useEffect(() => {
    if (seconds > 0 && remaining === 0) onExpireRef.current();
  }, [remaining, seconds]);

  return remaining;
}
