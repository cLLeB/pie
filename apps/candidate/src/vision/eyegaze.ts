export interface BlendshapeCategory {
  categoryName: string;
  score: number;
}

export interface EyeAversion {
  /** How far the eyes look down (0–1). */
  down: number;
  /** How far the eyes look to either side (0–1). */
  side: number;
  /** Overall eye aversion = max(down, side). */
  away: number;
}

/**
 * Eye-direction aversion from MediaPipe FaceLandmarker blendshapes. Unlike head
 * pose, this catches the realistic cheat — eyes glancing down at a lap/phone or
 * sideways at notes while the head stays facing the screen. Scores are 0–1.
 *
 * Looking to the subject's left = left eye looks "out" + right eye looks "in"
 * (and vice-versa), so each horizontal direction averages the matching pair.
 */
export function eyeAversion(categories: BlendshapeCategory[]): EyeAversion {
  const score = new Map(categories.map((c) => [c.categoryName, c.score]));
  const g = (name: string): number => score.get(name) ?? 0;

  const down = (g('eyeLookDownLeft') + g('eyeLookDownRight')) / 2;
  const gazeLeft = (g('eyeLookOutLeft') + g('eyeLookInRight')) / 2;
  const gazeRight = (g('eyeLookOutRight') + g('eyeLookInLeft')) / 2;
  const side = Math.max(gazeLeft, gazeRight);

  return { down, side, away: Math.max(down, side) };
}
