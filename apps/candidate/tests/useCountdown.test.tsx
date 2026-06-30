import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useCountdown } from '../src/exam/useCountdown';

function Harness({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const remaining = useCountdown(seconds, onExpire);
  return <span data-testid="remaining">{remaining}</span>;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useCountdown', () => {
  it('counts down each second and calls onExpire once at zero', () => {
    const onExpire = vi.fn();
    render(<Harness seconds={2} onExpire={onExpire} />);
    expect(screen.getByTestId('remaining').textContent).toBe('2');

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('remaining').textContent).toBe('1');
    expect(onExpire).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('remaining').textContent).toBe('0');
    expect(onExpire).toHaveBeenCalledTimes(1);

    // No further ticks after expiry.
    act(() => vi.advanceTimersByTime(5000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
