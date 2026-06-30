import type { EditOp } from './ops.js';

export interface ProvenanceMetrics {
  /** Characters inserted by typing. */
  typedChars: number;
  /** Characters inserted by pasting. */
  pastedChars: number;
  /** Number of distinct paste operations. */
  pasteCount: number;
  /** pastedChars / (typedChars + pastedChars); 0 when nothing was inserted. */
  pasteRatio: number;
  /** Wall-clock span of the authoring (last op time − first op time). */
  durationMs: number;
  /** Total number of ops. */
  opCount: number;
}

/**
 * Summarize an answer's authoring provenance. A high pasteRatio over a short
 * duration is the strongest browser-feasible signal that text was produced
 * elsewhere (e.g. an AI tool) rather than composed in place — the inversion at
 * the heart of Proof-of-Authorship. This is evidence, never an automatic verdict.
 */
export function provenanceMetrics(ops: EditOp[]): ProvenanceMetrics {
  let typedChars = 0;
  let pastedChars = 0;
  let pasteCount = 0;

  for (const op of ops) {
    if (op.kind === 'insert') {
      typedChars += op.text?.length ?? 0;
    } else if (op.kind === 'paste') {
      pastedChars += op.text?.length ?? 0;
      pasteCount += 1;
    }
  }

  const inserted = typedChars + pastedChars;
  const pasteRatio = inserted === 0 ? 0 : pastedChars / inserted;
  const durationMs = ops.length === 0 ? 0 : ops[ops.length - 1]!.t - ops[0]!.t;

  return { typedChars, pastedChars, pasteCount, pasteRatio, durationMs, opCount: ops.length };
}
