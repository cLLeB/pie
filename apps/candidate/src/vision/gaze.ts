export interface Keypoint {
  x: number;
  y: number;
}

/**
 * Signed horizontal gaze/orientation ratio from the face detector's keypoints.
 * BlazeFace order: [rightEye, leftEye, noseTip, mouth, rightEar, leftEar] (0–1).
 * Facing forward the nose sits midway between the eyes (ratio ≈ 0); turning the
 * head shifts the nose toward one eye (|ratio| grows). Returns null when there
 * aren't enough keypoints to judge.
 */
export function gazeRatio(keypoints: Keypoint[]): number | null {
  if (keypoints.length < 3) return null;
  const rightEye = keypoints[0]!;
  const leftEye = keypoints[1]!;
  const nose = keypoints[2]!;
  const eyeMidX = (rightEye.x + leftEye.x) / 2;
  const eyeDist = Math.abs(leftEye.x - rightEye.x);
  if (eyeDist < 1e-6) return null;
  return (nose.x - eyeMidX) / eyeDist;
}

/** Whether the face is oriented toward the screen. True when undetermined. */
export function isLookingForward(keypoints: Keypoint[], threshold = 0.18): boolean {
  const ratio = gazeRatio(keypoints);
  if (ratio === null) return true;
  return Math.abs(ratio) <= threshold;
}
