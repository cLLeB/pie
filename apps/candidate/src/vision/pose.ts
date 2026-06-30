export interface HeadPose {
  /** Left/right rotation in degrees (0 = facing forward). */
  yaw: number;
  /** Up/down rotation in degrees (positive/negative = up/down depending on rig). */
  pitch: number;
  /** Tilt in degrees. */
  roll: number;
}

/**
 * Extract head Euler angles (degrees) from MediaPipe's 4x4 facial transformation
 * matrix. The matrix is column-major, so element (row, col) is at index col*4+row.
 * We use the standard ZYX (yaw-pitch-roll) decomposition of the rotation block.
 */
export function eulerFromMatrix(m: ArrayLike<number>): HeadPose {
  const r00 = m[0]!;
  const r10 = m[1]!;
  const r20 = m[2]!;
  const r21 = m[6]!;
  const r22 = m[10]!;

  const toDeg = 180 / Math.PI;
  const pitch = Math.atan2(r21, r22) * toDeg;
  const yaw = Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22)) * toDeg;
  const roll = Math.atan2(r10, r00) * toDeg;
  return { yaw, pitch, roll };
}

/**
 * Whether the head is oriented toward the screen within the given angle limits.
 * `pitchCenter` is the pitch reading when looking straight at the screen (the
 * camera rig's forward reference) — calibrated from the live debug readout.
 */
export function isFacingScreen(
  pose: HeadPose,
  yawLimit = 22,
  pitchLimit = 18,
  pitchCenter = 0,
): boolean {
  return Math.abs(pose.yaw) <= yawLimit && Math.abs(pose.pitch - pitchCenter) <= pitchLimit;
}
