import { describe, it, expect } from 'vitest';
import { eulerFromMatrix, isFacingScreen } from '../src/vision/pose';

// Column-major 4x4. Identity = facing forward.
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// 90° rotation about Y (yaw). Row-major R = [[0,0,1],[0,1,0],[-1,0,0]] → column-major below.
const YAW_90 = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1];

describe('eulerFromMatrix', () => {
  it('returns zero angles for the identity matrix', () => {
    const p = eulerFromMatrix(IDENTITY);
    expect(p.yaw).toBeCloseTo(0, 5);
    expect(p.pitch).toBeCloseTo(0, 5);
    expect(p.roll).toBeCloseTo(0, 5);
  });

  it('recovers a 90° yaw', () => {
    expect(eulerFromMatrix(YAW_90).yaw).toBeCloseTo(90, 4);
  });
});

describe('isFacingScreen', () => {
  it('passes when within yaw and pitch limits', () => {
    expect(isFacingScreen({ yaw: 5, pitch: 3, roll: 0 })).toBe(true);
  });

  it('fails on a large yaw (looking sideways)', () => {
    expect(isFacingScreen({ yaw: 40, pitch: 0, roll: 0 })).toBe(false);
  });

  it('fails on a large pitch deviation (looking down)', () => {
    expect(isFacingScreen({ yaw: 0, pitch: 35, roll: 0 })).toBe(false);
  });

  it('respects a calibrated pitch center', () => {
    // If "forward" reads pitch 30, then 35 is only 5° off → facing screen.
    expect(isFacingScreen({ yaw: 0, pitch: 35, roll: 0 }, 22, 18, 30)).toBe(true);
  });
});
