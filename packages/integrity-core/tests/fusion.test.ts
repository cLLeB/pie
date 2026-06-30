import { describe, it, expect } from 'vitest';
import { analyzeIntegrity } from '../src/fusion.js';
import type { IntegrityEvent } from '../src/events.js';
import type { AnswerSummary } from '../src/bundle.js';
import { provenanceMetrics } from '../src/provenance/metrics.js';
import type { EditOp } from '../src/provenance/ops.js';

function ev(seq: number, ts: number, type: string, data: Record<string, unknown> = {}): IntegrityEvent {
  return { seq, ts, type, data, prevHash: '', hash: '' };
}

function textAnswer(id: string, ops: EditOp[]): AnswerSummary {
  return { id, kind: 'text', metrics: provenanceMetrics(ops), ops };
}

describe('analyzeIntegrity', () => {
  it('flags a paste that follows a focus loss within the window (high severity)', () => {
    const events = [
      ev(0, 1000, 'session.start'),
      ev(1, 2000, 'focus.lost'),
      ev(2, 5000, 'clipboard.paste', { length: 200 }), // 3s after leaving
    ];
    const flags = analyzeIntegrity({ events, answers: [] });
    const f = flags.find((x) => x.code === 'paste-after-focus-loss');
    expect(f?.severity).toBe('high');
  });

  it('does NOT flag a paste long after the focus loss', () => {
    const events = [
      ev(0, 1000, 'focus.lost'),
      ev(1, 100_000, 'clipboard.paste', { length: 200 }), // 99s later
    ];
    const flags = analyzeIntegrity({ events, answers: [] });
    expect(flags.some((x) => x.code === 'paste-after-focus-loss')).toBe(false);
  });

  it('flags identity mismatches', () => {
    const flags = analyzeIntegrity({ events: [ev(0, 1, 'identity.mismatch', { score: 0.3 })], answers: [] });
    expect(flags[0]?.code).toBe('identity-mismatch');
    expect(flags[0]?.severity).toBe('high');
  });

  it('flags excessive focus loss only above the threshold', () => {
    const many = [0, 1, 2, 3].map((i) => ev(i, i, 'focus.lost'));
    expect(analyzeIntegrity({ events: many, answers: [] }).some((f) => f.code === 'excessive-focus-loss')).toBe(true);
    const few = [0, 1].map((i) => ev(i, i, 'focus.lost'));
    expect(analyzeIntegrity({ events: few, answers: [] }).some((f) => f.code === 'excessive-focus-loss')).toBe(false);
  });

  it('flags pasted text answers and a too-fast choice', () => {
    const pasted = textAnswer('q1', [{ t: 0, kind: 'paste', pos: 0, text: 'an AI answer' }]);
    const fastChoice: AnswerSummary = {
      id: 'q2',
      kind: 'choice',
      metrics: provenanceMetrics([]),
      ops: [],
      choice: { value: 'A', latencyMs: 800, changes: 0 },
    };
    const flags = analyzeIntegrity({ events: [], answers: [pasted, fastChoice] });
    expect(flags.some((f) => f.code === 'pasted-content' && f.severity === 'high')).toBe(true);
    expect(flags.some((f) => f.code === 'fast-choice')).toBe(true);
  });

  it('returns no flags for a clean session and sorts high severity first', () => {
    expect(analyzeIntegrity({ events: [ev(0, 1, 'session.start')], answers: [textAnswer('q1', [
      { t: 0, kind: 'insert', pos: 0, text: 'h' },
    ])] })).toEqual([]);

    const flags = analyzeIntegrity({
      events: [ev(0, 1, 'focus.lost'), ev(1, 2, 'clipboard.paste'), ev(2, 3, 'focus.lost'), ev(3, 4, 'focus.lost'), ev(4, 5, 'focus.lost')],
      answers: [],
    });
    expect(flags[0]?.severity).toBe('high'); // paste-after-focus-loss ranked above excessive-focus-loss
  });
});
