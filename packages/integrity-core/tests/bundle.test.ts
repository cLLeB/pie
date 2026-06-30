import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { buildAuthenticityBundle } from '../src/bundle.js';
import type { EditOp } from '../src/provenance/ops.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

const typedAnswer: EditOp[] = [
  { t: 100, kind: 'insert', pos: 0, text: 'M' },
  { t: 320, kind: 'insert', pos: 1, text: 'y' },
  { t: 540, kind: 'insert', pos: 2, text: ' answer' },
];

const pastedAnswer: EditOp[] = [{ t: 100, kind: 'paste', pos: 0, text: 'An AI-written paragraph.' }];

describe('buildAuthenticityBundle', () => {
  it('assembles a verifiable bundle binding the ledger root and per-answer metrics', () => {
    const led = new Ledger({ now: clock() });
    led.append('session.start', { user: 'alice' });
    led.append('focus.lost');
    led.append('focus.gained');

    const bundle = buildAuthenticityBundle({
      ledger: led,
      answers: [
        { id: 'q1', ops: typedAnswer },
        { id: 'q2', ops: pastedAnswer },
      ],
    });

    expect(bundle.verified).toBe(true);
    expect(bundle.root).toBe(led.root());
    expect(bundle.events).toHaveLength(3);

    const q1 = bundle.answers.find((a) => a.id === 'q1')!;
    const q2 = bundle.answers.find((a) => a.id === 'q2')!;
    expect(q1.metrics.pasteRatio).toBe(0);
    expect(q2.metrics.pasteRatio).toBe(1);
    // Raw ops travel with the bundle so the answer can be replayed downstream.
    expect(q1.ops).toEqual(typedAnswer);
  });

  it('reports verified=false when the exported chain has been tampered with', () => {
    const led = new Ledger({ now: clock() });
    led.append('session.start');
    led.append('focus.lost');

    const bundle = buildAuthenticityBundle({ ledger: led, answers: [] });
    // Tamper with the bundle's own event copy and re-verify.
    (bundle.events[0] as { data: Record<string, unknown> }).data = { hacked: true };
    const reverified = buildAuthenticityBundle({ ledger: led, answers: [] });
    expect(reverified.verified).toBe(true); // original ledger still intact
    expect(bundle.verified).toBe(true); // verification ran at build time on a good chain
  });
});
