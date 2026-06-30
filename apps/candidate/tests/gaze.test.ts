import { describe, it, expect } from 'vitest';
import { isLookingForward, type Keypoint } from '../src/vision/gaze';

// [rightEye, leftEye, noseTip, ...]
function pts(rightEyeX: number, leftEyeX: number, noseX: number): Keypoint[] {
  return [
    { x: rightEyeX, y: 0.4 },
    { x: leftEyeX, y: 0.4 },
    { x: noseX, y: 0.5 },
  ];
}

describe('isLookingForward', () => {
  it('returns true when the nose is centered between the eyes (facing screen)', () => {
    expect(isLookingForward(pts(0.4, 0.6, 0.5))).toBe(true);
  });

  it('returns false when the head is turned (nose shifted toward one eye)', () => {
    // eyes 0.4..0.6 (dist 0.2), nose at 0.59 → offset 0.09 / 0.2 = 0.45 > 0.35
    expect(isLookingForward(pts(0.4, 0.6, 0.59))).toBe(false);
  });

  it('respects a custom threshold', () => {
    // same offset ratio 0.45 — with a looser threshold it counts as forward
    expect(isLookingForward(pts(0.4, 0.6, 0.59), 0.5)).toBe(true);
  });

  it('returns true when there are too few keypoints to judge', () => {
    expect(isLookingForward([{ x: 0.5, y: 0.5 }])).toBe(true);
  });
});
