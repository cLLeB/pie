import type { EventSink, Sensor } from './sensor.js';

/**
 * The slice of the DOM the VisibilitySensor needs. In production this is backed
 * by `window`/`document`; in tests it's a fake. Keeping it injected means the
 * sensor logic is verified without a browser or jsdom.
 */
export interface VisibilitySource {
  addEventListener(type: string, cb: () => void): void;
  removeEventListener(type: string, cb: () => void): void;
  /** True when the page is currently hidden (document.hidden). */
  hidden(): boolean;
}

/**
 * Emits the cheapest, most reliable cheating signal there is: the candidate
 * leaving the exam surface. `blur`/`focus` cover alt-tabbing away from the
 * window; `visibilitychange` covers tab switches and minimization.
 */
export class VisibilitySensor implements Sensor {
  private readonly handlers: Array<{ type: string; cb: () => void }> = [];

  constructor(
    private readonly sink: EventSink,
    private readonly source: VisibilitySource,
  ) {}

  start(): void {
    this.bind('blur', () => this.sink('focus.lost'));
    this.bind('focus', () => this.sink('focus.gained'));
    this.bind('visibilitychange', () => {
      this.sink(this.source.hidden() ? 'visibility.hidden' : 'visibility.visible');
    });
  }

  stop(): void {
    for (const { type, cb } of this.handlers) {
      this.source.removeEventListener(type, cb);
    }
    this.handlers.length = 0;
  }

  private bind(type: string, cb: () => void): void {
    this.source.addEventListener(type, cb);
    this.handlers.push({ type, cb });
  }
}
