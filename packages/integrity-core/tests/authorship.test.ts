import { describe, it, expect } from 'vitest';
import { authorshipVerdict } from '../src/authorship.js';
import { provenanceMetrics } from '../src/provenance/metrics.js';
import type { EditOp } from '../src/provenance/ops.js';

const typed = (n: number): EditOp[] =>
  Array.from({ length: n }, (_, i) => ({ t: i, kind: 'insert', pos: i, text: 'x' }));
const paste = (text: string, t = 0): EditOp => ({ t, kind: 'paste', pos: 0, text });

describe('authorshipVerdict', () => {
  it('marks fully-typed answers as authored', () => {
    expect(authorshipVerdict(provenanceMetrics(typed(20))).level).toBe('ok');
  });

  it('flags a fully-pasted answer', () => {
    const v = authorshipVerdict(provenanceMetrics([paste('an AI answer')]));
    expect(v.level).toBe('review');
    expect(v.label).toMatch(/fully pasted/);
  });

  it('flags pasted content even when typing dilutes the ratio (the evasion case)', () => {
    // 50 typed chars + one 10-char paste → ratio is low, but it must still flag.
    const ops = [...typed(50), paste('ten-charsX')];
    const v = authorshipVerdict(provenanceMetrics(ops));
    expect(v.level).toBe('review');
    expect(v.label).toMatch(/contains pasted content/);
  });

  it('tolerates a sub-threshold paste when minPaste is raised', () => {
    const ops = [...typed(50), paste('x')]; // a single pasted char
    expect(authorshipVerdict(provenanceMetrics(ops), 2).level).toBe('ok');
  });
});
