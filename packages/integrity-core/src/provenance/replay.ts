import { applyAll, type EditOp } from './ops.js';

/**
 * Reconstruct the answer text after the first `step` ops have been applied.
 * Folding the op stream up to any index lets a reviewer "play back" the writing
 * of an answer from a few kilobytes of timing data — the lightweight, offline-
 * friendly alternative to storing screen video.
 */
export function textAtStep(ops: EditOp[], step: number): string {
  const clamped = Math.max(0, Math.min(step, ops.length));
  return applyAll(ops.slice(0, clamped));
}
