import { describe, it, expect } from 'vitest';
import { rms, isVoiceLevel } from '../src/audio/level';

function tone(amplitude: number, n = 256): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((i / n) * Math.PI * 8);
  return out;
}

describe('rms', () => {
  it('is zero for silence and grows with amplitude', () => {
    expect(rms(new Float32Array(128))).toBe(0);
    expect(rms(tone(0.5))).toBeGreaterThan(rms(tone(0.1)));
  });

  it('returns 0 for an empty buffer', () => {
    expect(rms(new Float32Array(0))).toBe(0);
  });
});

describe('isVoiceLevel', () => {
  it('treats quiet buffers as no-voice and loud ones as voice', () => {
    expect(isVoiceLevel(tone(0.005))).toBe(false);
    expect(isVoiceLevel(tone(0.5))).toBe(true);
  });
});
