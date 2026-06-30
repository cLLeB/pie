import type { EventSink, Sensor } from './sensor.js';

/** The slice of the DOM the FullscreenSensor needs; injected for testability. */
export interface FullscreenSource {
  addEventListener(type: string, cb: () => void): void;
  removeEventListener(type: string, cb: () => void): void;
  /** True when the document is currently in fullscreen. */
  isFullscreen(): boolean;
}

/**
 * Tracks fullscreen enter/exit. Many exams require fullscreen; leaving it is a
 * commit-breaking signal (the candidate may be consulting another window). The
 * sensor only reports the event — policy (warn, lock, end) lives elsewhere.
 */
export class FullscreenSensor implements Sensor {
  private readonly cb = () => {
    this.sink(this.source.isFullscreen() ? 'fullscreen.entered' : 'fullscreen.exited');
  };

  constructor(
    private readonly sink: EventSink,
    private readonly source: FullscreenSource,
  ) {}

  start(): void {
    this.source.addEventListener('fullscreenchange', this.cb);
  }

  stop(): void {
    this.source.removeEventListener('fullscreenchange', this.cb);
  }
}
