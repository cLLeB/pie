export interface Keypoint {
  x: number;
  y: number;
}

/**
 * Estimate whether the face is oriented toward the screen, from the face
 * detector's keypoints. BlazeFace returns them in the order
 * [rightEye, leftEye, noseTip, mouth, rightEar, leftEar] (normalized 0–1).
 *
 * Heuristic: when facing forward the nose sits roughly midway between the eyes.
 * As the head turns left/right the nose shifts toward one eye, so we measure the
 * nose's horizontal offset from the eye midpoint, scaled by the inter-eye
 * distance. Beyond `threshold` we treat it as looking away. With too few points to
 * judge, we return true (never flag on missing data).
 */
export function isLookingForward(keypoints: Keypoint[], threshold = 0.35): boolean {
  if (keypoints.length < 3) return true;
  const rightEye = keypoints[0]!;
  const leftEye = keypoints[1]!;
  const nose = keypoints[2]!;
  const eyeMidX = (rightEye.x + leftEye.x) / 2;
  const eyeDist = Math.abs(leftEye.x - rightEye.x);
  if (eyeDist < 1e-6) return true;
  const ratio = (nose.x - eyeMidX) / eyeDist;
  return Math.abs(ratio) <= threshold;
}
