/**
 * A keystroke-level edit operation in the genesis of an answer.
 *
 * - `insert`: a character the candidate typed at `pos` (text length usually 1).
 * - `paste`:  text inserted via paste at `pos` — provenance-distinct from typing.
 * - `delete`: `len` characters removed starting at `pos`.
 *
 * `t` is a timestamp (ms). The op stream is the raw material for both the
 * authorship metrics and the replay — it reconstructs *how* an answer was written.
 */
export interface EditOp {
  t: number;
  kind: 'insert' | 'delete' | 'paste';
  pos: number;
  text?: string;
  len?: number;
}

/** Apply a single op to a document string, returning a new string (immutable). */
export function applyOp(doc: string, op: EditOp): string {
  switch (op.kind) {
    case 'insert':
    case 'paste': {
      const text = op.text ?? '';
      return doc.slice(0, op.pos) + text + doc.slice(op.pos);
    }
    case 'delete': {
      const len = op.len ?? 0;
      return doc.slice(0, op.pos) + doc.slice(op.pos + len);
    }
  }
}

/** Fold a sequence of ops into a final document, optionally from an initial string. */
export function applyAll(ops: EditOp[], doc = ''): string {
  return ops.reduce(applyOp, doc);
}
