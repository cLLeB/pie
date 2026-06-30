import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { GazeSensor } from '../src/sensors/gaze.js';
import { ProhibitedObjectSensor } from '../src/sensors/objects.js';

function clock(): () => number {
  let t = 0;
  return () => (t += 1);
}

describe('GazeSensor', () => {
  it('does not flag off-screen until the dwell threshold is reached', () => {
    const led = new Ledger({ now: clock() });
    const g = new GazeSensor((type, data) => led.append(type, data), 3);
    g.observe(false);
    g.observe(false);
    expect(led.export()).toHaveLength(0); // below threshold
    g.observe(false);
    expect(led.export().map((e) => e.type)).toEqual(['gaze.offscreen']);
  });

  it('emits onscreen once gaze returns, and does not double-flag', () => {
    const led = new Ledger({ now: clock() });
    const g = new GazeSensor((type, data) => led.append(type, data), 2);
    g.observe(false);
    g.observe(false); // flag offscreen
    g.observe(false); // still off, no new event
    g.observe(true); // back onscreen
    expect(led.export().map((e) => e.type)).toEqual(['gaze.offscreen', 'gaze.onscreen']);
  });
});

describe('ProhibitedObjectSensor', () => {
  it('emits once when a prohibited object appears and again when it clears', () => {
    const led = new Ledger({ now: clock() });
    const o = new ProhibitedObjectSensor((type, data) => led.append(type, data));
    o.observe(['cell phone']);
    o.observe(['cell phone']); // still there → no duplicate
    o.observe([]); // gone
    const events = led.export();
    expect(events.map((e) => e.type)).toEqual(['object.detected', 'object.cleared']);
    expect(events[0]!.data).toEqual({ label: 'cell phone' });
  });

  it('ignores non-prohibited labels', () => {
    const led = new Ledger({ now: clock() });
    const o = new ProhibitedObjectSensor((type, data) => led.append(type, data), ['cell phone']);
    o.observe(['person', 'chair', 'cup']);
    expect(led.export()).toHaveLength(0);
  });
});
