import { describe, it, expect } from 'vitest';
import { SensorMesh } from '../src/sensors/mesh.js';
import type { Sensor } from '../src/sensors/sensor.js';

class CountingSensor implements Sensor {
  started = 0;
  stopped = 0;
  start(): void {
    this.started += 1;
  }
  stop(): void {
    this.stopped += 1;
  }
}

describe('SensorMesh', () => {
  it('starts and stops every registered sensor', () => {
    const a = new CountingSensor();
    const b = new CountingSensor();
    const mesh = new SensorMesh().add(a).add(b);

    mesh.start();
    expect([a.started, b.started]).toEqual([1, 1]);

    mesh.stop();
    expect([a.stopped, b.stopped]).toEqual([1, 1]);
  });

  it('reports how many sensors are registered', () => {
    const mesh = new SensorMesh().add(new CountingSensor());
    expect(mesh.size).toBe(1);
  });
});
