import { describe, it, expect } from 'vitest';
import { ProvenanceRecorder } from '../src/provenance/recorder.js';
import { provenanceMetrics } from '../src/provenance/metrics.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 100);
}

describe('ProvenanceRecorder', () => {
  it('maps typed characters to insert ops', () => {
    const rec = new ProvenanceRecorder(clock());
    rec.onInput({ inputType: 'insertText', data: 'h', selectionStart: 0 });
    rec.onInput({ inputType: 'insertText', data: 'i', selectionStart: 1 });
    expect(rec.ops()).toEqual([
      { t: 100, kind: 'insert', pos: 0, text: 'h' },
      { t: 200, kind: 'insert', pos: 1, text: 'i' },
    ]);
  });

  it('maps a paste to a paste op carrying the pasted text', () => {
    const rec = new ProvenanceRecorder(clock());
    rec.onInput({ inputType: 'insertFromPaste', data: 'hello world', selectionStart: 0 });
    const ops = rec.ops();
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ kind: 'paste', text: 'hello world', pos: 0 });
  });

  it('maps backspace to a delete op of length 1', () => {
    const rec = new ProvenanceRecorder(clock());
    rec.onInput({ inputType: 'insertText', data: 'a', selectionStart: 0 });
    rec.onInput({ inputType: 'deleteContentBackward', data: null, selectionStart: 1 });
    expect(rec.ops()[1]).toEqual({ t: 200, kind: 'delete', pos: 0, len: 1 });
  });

  it('produces ops whose metrics flag a pure paste as pasteRatio 1', () => {
    const rec = new ProvenanceRecorder(clock());
    rec.onInput({ inputType: 'insertFromPaste', data: 'ChatGPT answer', selectionStart: 0 });
    expect(provenanceMetrics(rec.ops()).pasteRatio).toBe(1);
  });
});
