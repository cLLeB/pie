import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { FacePresenceSensor, presenceState } from '../src/sensors/face-presence.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('presenceState', () => {
  it('maps face counts to states', () => {
    expect(presenceState(0)).toBe('absent');
    expect(presenceState(1)).toBe('present');
    expect(presenceState(3)).toBe('multiple');
  });
});

describe('FacePresenceSensor', () => {
  it('emits on confirmed state change (absence threshold = 1 for immediacy)', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data), 1);

    sensor.observe(1); // present
    sensor.observe(1); // unchanged → no event
    sensor.observe(0); // absent (threshold 1)
    sensor.observe(2); // multiple

    expect(led.export().map((e) => e.type)).toEqual([
      'face.present',
      'face.absent',
      'face.multiple',
    ]);
  });

  it('does NOT report "no face" on a brief drop — needs consecutive empty frames', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data), 3);

    sensor.observe(1); // present
    sensor.observe(0); // brief loss (1)
    sensor.observe(0); // brief loss (2) — still under threshold
    sensor.observe(1); // face back → streak resets, no absent event emitted

    expect(led.export().map((e) => e.type)).toEqual(['face.present']);
    expect(sensor.state()).toBe('present');
  });

  it('reports "no face" once the absence persists past the threshold', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data), 3);
    sensor.observe(1);
    sensor.observe(0);
    sensor.observe(0);
    sensor.observe(0); // third consecutive empty → confirmed absent
    expect(led.export().map((e) => e.type)).toEqual(['face.present', 'face.absent']);
    expect(sensor.state()).toBe('absent');
  });

  it('includes the observed count in the event data', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data), 1);
    sensor.observe(3);
    expect(led.export()[0]!.data).toEqual({ count: 3 });
  });
});
