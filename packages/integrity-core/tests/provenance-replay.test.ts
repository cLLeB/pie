import { describe, it, expect } from 'vitest';
import { textAtStep } from '../src/provenance/replay.js';
import type { EditOp } from '../src/provenance/ops.js';

const ops: EditOp[] = [
  { t: 0, kind: 'insert', pos: 0, text: 'h' },
  { t: 1, kind: 'insert', pos: 1, text: 'i' },
  { t: 2, kind: 'paste', pos: 2, text: '!!' },
  { t: 3, kind: 'delete', pos: 3, len: 1 },
];

describe('textAtStep', () => {
  it('is empty at step 0', () => {
    expect(textAtStep(ops, 0)).toBe('');
  });

  it('reconstructs an intermediate state', () => {
    expect(textAtStep(ops, 2)).toBe('hi');
    expect(textAtStep(ops, 3)).toBe('hi!!');
  });

  it('returns the final state at or beyond the last step', () => {
    expect(textAtStep(ops, 4)).toBe('hi!');
    expect(textAtStep(ops, 99)).toBe('hi!');
  });
});
