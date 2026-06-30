import { describe, it, expect } from 'vitest';
import { formatDuration } from '../src/exam/time';

describe('formatDuration', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(3600)).toBe('60:00');
  });

  it('clamps negative values to zero', () => {
    expect(formatDuration(-10)).toBe('0:00');
  });
});
