import type { EventSink, Sensor } from './sensor.js';

const DEFAULT_PROHIBITED = ['cell phone', 'book', 'laptop', 'tv', 'remote'];

/**
 * Prohibited-object detector. An on-device object detector (YOLOv8n via ONNX-Web)
 * calls `observe` with the labels currently visible; the sensor emits
 * `object.detected` when a prohibited item first appears and `object.cleared` when
 * it leaves, deduped so a phone held for 10s is one event, not hundreds.
 */
export class ProhibitedObjectSensor implements Sensor {
  private active = new Set<string>();
  private readonly prohibited: Set<string>;

  constructor(
    private readonly sink: EventSink,
    prohibited: string[] = DEFAULT_PROHIBITED,
  ) {
    this.prohibited = new Set(prohibited);
  }

  start(): void {}
  stop(): void {
    this.active.clear();
  }

  observe(labels: string[]): void {
    const present = new Set(labels.filter((l) => this.prohibited.has(l)));
    for (const label of present) {
      if (!this.active.has(label)) this.sink('object.detected', { label });
    }
    for (const label of this.active) {
      if (!present.has(label)) this.sink('object.cleared', { label });
    }
    this.active = present;
  }
}
