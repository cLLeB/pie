import type { Sensor } from './sensor.js';

/**
 * A collection of sensors started and stopped together. This is the concrete
 * "sensor mesh": every monitoring technique is a Sensor module, and enabling or
 * disabling a signal is adding or removing one here. Toggleability by design.
 */
export class SensorMesh {
  private readonly sensors: Sensor[] = [];

  add(sensor: Sensor): this {
    this.sensors.push(sensor);
    return this;
  }

  get size(): number {
    return this.sensors.length;
  }

  start(): void {
    for (const s of this.sensors) s.start();
  }

  stop(): void {
    for (const s of this.sensors) s.stop();
  }
}
