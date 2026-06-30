/** Where a sensor delivers integrity events (typically `ledger.append`). */
export type EventSink = (type: string, data?: Record<string, unknown>) => void;

/**
 * A monitoring module. Each sensor is independent and toggleable — the "sensor
 * mesh" is just a collection of these. Sensors isolate all DOM/platform access
 * behind injected sources so the core stays environment-agnostic and testable.
 */
export interface Sensor {
  start(): void;
  stop(): void;
}
