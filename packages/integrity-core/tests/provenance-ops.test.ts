import { describe, it, expect } from 'vitest';
import { applyOp, applyAll, type EditOp } from '../src/provenance/ops.js';

describe('applyOp', () => {
  it('inserts text at a position', () => {
    expect(applyOp('', { t: 0, kind: 'insert', pos: 0, text: 'hi' })).toBe('hi');
    expect(applyOp('ab', { t: 0, kind: 'insert', pos: 1, text: 'X' })).toBe('aXb');
  });

  it('pastes text at a position (same splice as insert, different provenance)', () => {
    expect(applyOp('ab', { t: 0, kind: 'paste', pos: 1, text: 'X' })).toBe('aXb');
  });

  it('deletes len chars at a position', () => {
    expect(applyOp('ab', { t: 0, kind: 'delete', pos: 0, len: 1 })).toBe('b');
    expect(applyOp('abc', { t: 0, kind: 'delete', pos: 1, len: 2 })).toBe('a');
  });
});

describe('applyAll', () => {
  it('folds a sequence of ops into the final document', () => {
    const ops: EditOp[] = [
      { t: 0, kind: 'insert', pos: 0, text: 'h' },
      { t: 1, kind: 'insert', pos: 1, text: 'i' },
      { t: 2, kind: 'paste', pos: 2, text: '!!' },
      { t: 3, kind: 'delete', pos: 3, len: 1 },
    ];
    expect(applyAll(ops)).toBe('hi!');
  });

  it('starts from a provided initial document', () => {
    expect(applyAll([{ t: 0, kind: 'insert', pos: 3, text: 'd' }], 'abc')).toBe('abcd');
  });
});
