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
  it('emits an event only when presence state changes', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data));

    sensor.observe(1); // present
    sensor.observe(1); // unchanged → no event
    sensor.observe(0); // absent
    sensor.observe(2); // multiple

    expect(led.export().map((e) => e.type)).toEqual([
      'face.present',
      'face.absent',
      'face.multiple',
    ]);
  });

  it('includes the observed count in the event data', () => {
    const led = new Ledger({ now: clock() });
    const sensor = new FacePresenceSensor((type, data) => led.append(type, data));
    sensor.observe(3);
    expect(led.export()[0]!.data).toEqual({ count: 3 });
  });
});
