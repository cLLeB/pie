import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { FullscreenSensor, type FullscreenSource } from '../src/sensors/fullscreen.js';

class FakeFullscreen implements FullscreenSource {
  private listeners = new Set<() => void>();
  private _fs = false;
  addEventListener(_type: string, cb: () => void): void {
    this.listeners.add(cb);
  }
  removeEventListener(_type: string, cb: () => void): void {
    this.listeners.delete(cb);
  }
  isFullscreen(): boolean {
    return this._fs;
  }
  set(v: boolean): void {
    this._fs = v;
    for (const cb of this.listeners) cb();
  }
  count(): number {
    return this.listeners.size;
  }
}

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('FullscreenSensor', () => {
  it('emits fullscreen.entered then fullscreen.exited', () => {
    const led = new Ledger({ now: clock() });
    const src = new FakeFullscreen();
    const sensor = new FullscreenSensor((type, data) => led.append(type, data), src);
    sensor.start();

    src.set(true);
    src.set(false);

    expect(led.export().map((e) => e.type)).toEqual(['fullscreen.entered', 'fullscreen.exited']);
  });

  it('detaches on stop', () => {
    const led = new Ledger({ now: clock() });
    const src = new FakeFullscreen();
    const sensor = new FullscreenSensor((type) => led.append(type), src);
    sensor.start();
    sensor.stop();
    expect(src.count()).toBe(0);
    src.set(true);
    expect(led.export()).toHaveLength(0);
  });
});
