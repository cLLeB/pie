import type { EventSink, Sensor } from './sensor.js';

/**
 * Multi-monitor signal. A second display is a classic place to keep notes or an AI
 * assistant. In a pure web page this is observable via `screen.isExtended`; the
 * optional extension/helper can report it more reliably. The app calls `observe`
 * with the current extended-display state; the sensor emits on change.
 */
export class MultiMonitorSensor implements Sensor {
  private last: boolean | null = null;

  constructor(private readonly sink: EventSink) {}

  start(): void {}
  stop(): void {
    this.last = null;
  }

  observe(extended: boolean): void {
    if (extended === this.last) return;
    this.last = extended;
    this.sink(extended ? 'screen.multi_monitor' : 'screen.single_monitor');
  }
}
