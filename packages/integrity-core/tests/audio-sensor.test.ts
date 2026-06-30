import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { AudioActivitySensor } from '../src/sensors/audio.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('AudioActivitySensor', () => {
  it('flags voice only after sustained activity, then quiet when it stops', () => {
    const led = new Ledger({ now: clock() });
    const s = new AudioActivitySensor((type, data) => led.append(type, data), 2);

    s.observe(true); // 1 frame — below onset threshold
    expect(led.export()).toHaveLength(0);
    s.observe(true); // 2 consecutive → voice
    s.observe(true); // still talking → no duplicate
    s.observe(false); // stopped → quiet

    expect(led.export().map((e) => e.type)).toEqual(['audio.voice', 'audio.quiet']);
    expect(s.state()).toBe(false);
  });

  it('ignores a single isolated blip (cough/click)', () => {
    const led = new Ledger({ now: clock() });
    const s = new AudioActivitySensor((type, data) => led.append(type, data), 2);
    s.observe(true); // blip
    s.observe(false); // gone
    expect(led.export()).toHaveLength(0);
    expect(s.state()).toBe(false);
  });
});
