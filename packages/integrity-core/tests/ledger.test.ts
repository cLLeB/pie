import { describe, it, expect } from 'vitest';
import { Ledger, verifyChain } from '../src/ledger.js';

function fixedClock(start = 1000): () => number {
  let t = start;
  return () => (t += 10);
}

describe('Ledger', () => {
  it('assigns increasing seq starting at 0', () => {
    const led = new Ledger({ now: fixedClock() });
    const a = led.append('session.start');
    const b = led.append('focus.lost');
    expect(a.seq).toBe(0);
    expect(b.seq).toBe(1);
  });

  it('links the first event to genesis and each event to its predecessor', () => {
    const led = new Ledger({ genesis: 'GENESIS', now: fixedClock() });
    const a = led.append('session.start');
    const b = led.append('focus.lost', { ms: 1200 });
    expect(a.prevHash).toBe('GENESIS');
    expect(b.prevHash).toBe(a.hash);
  });

  it('uses the injected clock for timestamps', () => {
    const led = new Ledger({ now: fixedClock(1000) });
    const a = led.append('x');
    const b = led.append('y');
    expect(a.ts).toBe(1010);
    expect(b.ts).toBe(1020);
  });

  it('root() returns the hash of the most recent event', () => {
    const led = new Ledger({ now: fixedClock() });
    led.append('a');
    const last = led.append('b');
    expect(led.root()).toBe(last.hash);
  });

  it('verifies an untampered exported chain', () => {
    const led = new Ledger({ now: fixedClock() });
    led.append('a', { v: 1 });
    led.append('b', { v: 2 });
    led.append('c', { v: 3 });
    expect(verifyChain(led.export())).toEqual({ ok: true });
  });

  it('detects tampering with event data', () => {
    const led = new Ledger({ now: fixedClock() });
    led.append('a', { v: 1 });
    led.append('b', { v: 2 });
    const events = led.export();
    // Attacker rewrites history without recomputing the chain.
    (events[1] as { data: Record<string, unknown> }).data = { v: 999 };
    expect(verifyChain(events)).toEqual({ ok: false, brokenAt: 1 });
  });

  it('export returns a defensive copy (mutating it does not affect the ledger)', () => {
    const led = new Ledger({ now: fixedClock() });
    led.append('a');
    const first = led.export();
    first.pop();
    expect(led.export()).toHaveLength(1);
  });
});
