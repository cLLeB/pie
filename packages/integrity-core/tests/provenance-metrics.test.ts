import { describe, it, expect } from 'vitest';
import { provenanceMetrics } from '../src/provenance/metrics.js';
import type { EditOp } from '../src/provenance/ops.js';

describe('provenanceMetrics', () => {
  it('reports a pasteRatio of 0 for fully-typed answers', () => {
    const ops: EditOp[] = [
      { t: 100, kind: 'insert', pos: 0, text: 'h' },
      { t: 250, kind: 'insert', pos: 1, text: 'i' },
    ];
    const m = provenanceMetrics(ops);
    expect(m.typedChars).toBe(2);
    expect(m.pastedChars).toBe(0);
    expect(m.pasteCount).toBe(0);
    expect(m.pasteRatio).toBe(0);
    expect(m.durationMs).toBe(150);
    expect(m.opCount).toBe(2);
  });

  it('reports a pasteRatio of 1 for a fully-pasted answer (the AI-cheat tell)', () => {
    const ops: EditOp[] = [{ t: 100, kind: 'paste', pos: 0, text: 'hello' }];
    const m = provenanceMetrics(ops);
    expect(m.typedChars).toBe(0);
    expect(m.pastedChars).toBe(5);
    expect(m.pasteCount).toBe(1);
    expect(m.pasteRatio).toBe(1);
  });

  it('computes a fractional ratio for mixed authoring', () => {
    const ops: EditOp[] = [
      { t: 0, kind: 'insert', pos: 0, text: 'a' },
      { t: 1, kind: 'paste', pos: 1, text: 'bcd' },
    ];
    const m = provenanceMetrics(ops);
    expect(m.pasteRatio).toBeCloseTo(0.75, 5);
  });

  it('returns all-zero metrics for an empty op stream', () => {
    expect(provenanceMetrics([])).toEqual({
      typedChars: 0,
      pastedChars: 0,
      pasteCount: 0,
      pasteRatio: 0,
      durationMs: 0,
      opCount: 0,
    });
  });
});
