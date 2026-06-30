import { describe, it, expect } from 'vitest';
import { isLookingForward, gazeRatio, type Keypoint } from '../src/vision/gaze';

// [rightEye, leftEye, noseTip, ...]
function pts(rightEyeX: number, leftEyeX: number, noseX: number): Keypoint[] {
  return [
    { x: rightEyeX, y: 0.4 },
    { x: leftEyeX, y: 0.4 },
    { x: noseX, y: 0.5 },
  ];
}

describe('gazeRatio', () => {
  it('is ~0 when the nose is centered between the eyes', () => {
    expect(gazeRatio(pts(0.4, 0.6, 0.5))).toBeCloseTo(0, 5);
  });

  it('grows as the nose shifts toward one eye', () => {
    // eyes 0.4..0.6 (dist 0.2), nose 0.55 → offset 0.05 / 0.2 = 0.25
    expect(gazeRatio(pts(0.4, 0.6, 0.55))).toBeCloseTo(0.25, 5);
  });

  it('returns null with too few keypoints', () => {
    expect(gazeRatio([{ x: 0.5, y: 0.5 }])).toBeNull();
  });
});

describe('isLookingForward', () => {
  it('true when centered, false on a moderate turn (default threshold 0.18)', () => {
    expect(isLookingForward(pts(0.4, 0.6, 0.5))).toBe(true);
    expect(isLookingForward(pts(0.4, 0.6, 0.55))).toBe(false); // ratio 0.25 > 0.18
  });

  it('respects a custom threshold', () => {
    expect(isLookingForward(pts(0.4, 0.6, 0.55), 0.3)).toBe(true); // 0.25 <= 0.3
  });

  it('true when undetermined (too few keypoints)', () => {
    expect(isLookingForward([{ x: 0.5, y: 0.5 }])).toBe(true);
  });
});
