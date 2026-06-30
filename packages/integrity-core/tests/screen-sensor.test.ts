import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { MultiMonitorSensor } from '../src/sensors/screen.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('MultiMonitorSensor', () => {
  it('emits on change to/from an extended display, deduped', () => {
    const led = new Ledger({ now: clock() });
    const s = new MultiMonitorSensor((type, data) => led.append(type, data));
    s.observe(false); // single — first observation, change from null
    s.observe(true); // extended
    s.observe(true); // no change
    s.observe(false); // back to single
    expect(led.export().map((e) => e.type)).toEqual([
      'screen.single_monitor',
      'screen.multi_monitor',
      'screen.single_monitor',
    ]);
  });
});
