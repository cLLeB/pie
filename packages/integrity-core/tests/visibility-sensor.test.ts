import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { VisibilitySensor, type VisibilitySource } from '../src/sensors/visibility.js';

/** A fake DOM-like source we can drive synchronously in tests. */
class FakeSource implements VisibilitySource {
  private listeners = new Map<string, Set<() => void>>();
  private _hidden = false;

  addEventListener(type: string, cb: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  removeEventListener(type: string, cb: () => void): void {
    this.listeners.get(type)?.delete(cb);
  }

  hidden(): boolean {
    return this._hidden;
  }

  setHidden(v: boolean): void {
    this._hidden = v;
  }

  fire(type: string): void {
    for (const cb of this.listeners.get(type) ?? []) cb();
  }

  listenerCount(): number {
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }
}

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('VisibilitySensor', () => {
  it('emits focus.lost / focus.gained on blur / focus', () => {
    const led = new Ledger({ now: clock() });
    const src = new FakeSource();
    const sensor = new VisibilitySensor((type, data) => led.append(type, data), src);
    sensor.start();

    src.fire('blur');
    src.fire('focus');

    const types = led.export().map((e) => e.type);
    expect(types).toEqual(['focus.lost', 'focus.gained']);
  });

  it('emits visibility.hidden / visibility.visible based on the source state', () => {
    const led = new Ledger({ now: clock() });
    const src = new FakeSource();
    const sensor = new VisibilitySensor((type, data) => led.append(type, data), src);
    sensor.start();

    src.setHidden(true);
    src.fire('visibilitychange');
    src.setHidden(false);
    src.fire('visibilitychange');

    const types = led.export().map((e) => e.type);
    expect(types).toEqual(['visibility.hidden', 'visibility.visible']);
  });

  it('stop() detaches all listeners (no further events)', () => {
    const led = new Ledger({ now: clock() });
    const src = new FakeSource();
    const sensor = new VisibilitySensor((type, data) => led.append(type, data), src);
    sensor.start();
    expect(src.listenerCount()).toBeGreaterThan(0);

    sensor.stop();
    expect(src.listenerCount()).toBe(0);

    src.fire('blur');
    expect(led.export()).toHaveLength(0);
  });
});
