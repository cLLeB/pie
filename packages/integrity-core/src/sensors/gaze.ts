import type { EventSink, Sensor } from './sensor.js';

/**
 * Off-screen gaze signal with a dwell threshold. Research is clear that flagging a
 * single off-screen frame produces false positives (and unfairly flags
 * neurodivergent candidates), so we only emit `gaze.offscreen` after the gaze has
 * been away for `threshold` consecutive observations, and `gaze.onscreen` when it
 * returns. An on-device gaze estimator (MediaPipe FaceMesh / L2CS) calls `observe`.
 */
export class GazeSensor implements Sensor {
  private consecutiveOff = 0;
  private flaggedOff = false;

  constructor(
    private readonly sink: EventSink,
    private readonly threshold = 3,
  ) {}

  start(): void {}
  stop(): void {
    this.consecutiveOff = 0;
    this.flaggedOff = false;
  }

  /** Whether the gaze is currently in the confirmed off-screen state. */
  isOffScreen(): boolean {
    return this.flaggedOff;
  }

  observe(onScreen: boolean): void {
    if (onScreen) {
      this.consecutiveOff = 0;
      if (this.flaggedOff) {
        this.flaggedOff = false;
        this.sink('gaze.onscreen');
      }
      return;
    }
    this.consecutiveOff += 1;
    if (!this.flaggedOff && this.consecutiveOff >= this.threshold) {
      this.flaggedOff = true;
      this.sink('gaze.offscreen', { frames: this.consecutiveOff });
    }
  }
}
