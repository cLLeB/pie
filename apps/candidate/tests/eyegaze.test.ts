import { describe, it, expect } from 'vitest';
import { eyeAversion, type BlendshapeCategory } from '../src/vision/eyegaze';

function cats(map: Record<string, number>): BlendshapeCategory[] {
  return Object.entries(map).map(([categoryName, score]) => ({ categoryName, score }));
}

describe('eyeAversion', () => {
  it('is ~0 when eyes look straight ahead', () => {
    const a = eyeAversion(cats({ eyeBlinkLeft: 0.1 }));
    expect(a.away).toBeCloseTo(0, 5);
  });

  it('detects eyes looking down', () => {
    const a = eyeAversion(cats({ eyeLookDownLeft: 0.8, eyeLookDownRight: 0.7 }));
    expect(a.down).toBeCloseTo(0.75, 5);
    expect(a.away).toBeCloseTo(0.75, 5);
  });

  it('detects eyes looking to the side', () => {
    // Looking to the subject's left: left eye out + right eye in.
    const a = eyeAversion(cats({ eyeLookOutLeft: 0.9, eyeLookInRight: 0.8 }));
    expect(a.side).toBeCloseTo(0.85, 5);
    expect(a.away).toBeCloseTo(0.85, 5);
  });

  it('treats missing categories as zero', () => {
    expect(eyeAversion([]).away).toBe(0);
  });
});
