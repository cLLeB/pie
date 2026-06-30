import type { EventSink, Sensor } from './sensor.js';

export type PresenceState = 'absent' | 'present' | 'multiple';

/** Map a detected face count to a presence state. */
export function presenceState(count: number): PresenceState {
  if (count <= 0) return 'absent';
  if (count === 1) return 'present';
  return 'multiple';
}

/**
 * Continuous face-presence signal. An on-device detector (MediaPipe/ONNX in the
 * app) calls `observe(count)` each frame/tick; the sensor emits only on state
 * change (present ↔ absent ↔ multiple), so the ledger captures "left seat" and
 * "someone else appeared" without storing any video — flags, not footage.
 *
 * Identity *continuity* (is it the SAME person) is a separate, sampled check via
 * the biometric `/v1` engine; this sensor answers only "is a face there, and how
 * many".
 */
export class FacePresenceSensor implements Sensor {
  private last: PresenceState | null = null;

  constructor(private readonly sink: EventSink) {}

  // No DOM to bind; the app drives `observe`. start/stop satisfy the Sensor
  // contract so this composes in a SensorMesh.
  start(): void {}
  stop(): void {
    this.last = null;
  }

  observe(count: number): void {
    const state = presenceState(count);
    if (state === this.last) return;
    this.last = state;
    this.sink(`face.${state}`, { count });
  }
}
