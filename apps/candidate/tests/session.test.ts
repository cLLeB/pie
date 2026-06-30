import { describe, it, expect } from 'vitest';
import { ExamSession } from '../src/exam/session';
import type { Exam } from '../src/exam/types';

const exam: Exam = {
  id: 'demo',
  title: 'Demo',
  durationSeconds: 600,
  questions: [
    { id: 'q1', prompt: 'Explain X.', kind: 'text' },
    { id: 'q2', prompt: 'Pick one.', kind: 'choice', options: ['A', 'B'] },
    { id: 'q3', prompt: 'Explain Y.', kind: 'text' },
  ],
};

function clock(): () => number {
  let t = 0;
  return () => (t += 100);
}

describe('ExamSession', () => {
  it('records a session.start event when started', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    const types = s.ledger.export().map((e) => e.type);
    expect(types).toContain('session.start');
  });

  it('reconstructs a typed answer from recorded provenance', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.recordInput('q1', { inputType: 'insertText', data: 'H', selectionStart: 0 });
    s.recordInput('q1', { inputType: 'insertText', data: 'i', selectionStart: 1 });
    expect(s.answerText('q1')).toBe('Hi');
  });

  it('logs focus loss/gain as integrity events', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.focusLost();
    s.focusGained();
    const types = s.ledger.export().map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['focus.lost', 'focus.gained']));
  });

  it('finalize() produces a verified bundle distinguishing typed from pasted answers', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    // q1 typed
    s.recordInput('q1', { inputType: 'insertText', data: 'a', selectionStart: 0 });
    s.recordInput('q1', { inputType: 'insertText', data: 'b', selectionStart: 1 });
    // q3 (also a text question) pasted — a single paste of an AI answer
    s.recordInput('q3', { inputType: 'insertFromPaste', data: 'pasted answer', selectionStart: 0 });

    const bundle = s.finalize();
    expect(bundle.verified).toBe(true);
    expect(bundle.root).toBe(s.ledger.root());

    const q1 = bundle.answers.find((a) => a.id === 'q1')!;
    const q3 = bundle.answers.find((a) => a.id === 'q3')!;
    expect(q1.metrics.pasteRatio).toBe(0);
    expect(q3.metrics.pasteRatio).toBe(1);
  });

  it('finalize classifies choice questions with selection, changes and latency', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.recordChoice('q2', 'A');
    s.recordChoice('q2', 'B'); // changed selection once
    const bundle = s.finalize();
    const q2 = bundle.answers.find((a) => a.id === 'q2')!;
    expect(q2.kind).toBe('choice');
    expect(q2.choice?.value).toBe('B');
    expect(q2.choice?.changes).toBe(1);
    expect(q2.metrics.pasteRatio).toBe(0); // never runs paste logic on a choice
  });

  it('logEvent appends an arbitrary integrity event (used by sensors and choice answers)', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.logEvent('answer.choice', { questionId: 'q2', value: 'A' });
    const ev = s.ledger.export().find((e) => e.type === 'answer.choice');
    expect(ev?.data).toMatchObject({ questionId: 'q2', value: 'A' });
  });

  it('exposes a live integrity summary for the glass-box panel', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.focusLost();
    const summary = s.integritySummary();
    expect(summary.focusLossCount).toBe(1);
    expect(summary.eventCount).toBeGreaterThanOrEqual(2);
    expect(summary.footageStored).toBe(false);
    expect(summary.identityChecks).toBe(0);
    expect(summary.lastIdentityMatch).toBeNull();
  });

  it('reports face presence, tolerating a brief drop before "no face"', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.observeFaceCount(1); // present
    s.observeFaceCount(0); // brief loss — not yet flagged (debounced)
    expect(s.integritySummary().facePresence).toBe('present');

    // Sustained absence (default 3 consecutive empty frames) confirms "no face".
    s.observeFaceCount(0);
    s.observeFaceCount(0);
    expect(s.integritySummary().facePresence).toBe('absent');

    const types = s.ledger.export().map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['face.present', 'face.absent']));
  });

  it('binds continuous-identity check results into the ledger and summary', () => {
    const s = new ExamSession(exam, { now: clock() });
    s.start();
    s.recordIdentityCheck(true, 0.97);
    s.recordIdentityCheck(false, 0.4);

    const types = s.ledger.export().map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['identity.verified', 'identity.mismatch']));

    const summary = s.integritySummary();
    expect(summary.identityChecks).toBe(2);
    expect(summary.lastIdentityMatch).toBe(false);
  });
});
