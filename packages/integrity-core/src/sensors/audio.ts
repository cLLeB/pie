import type { EventSink, Sensor } from './sensor.js';

/**
 * Microphone voice-activity signal with onset debouncing. An on-device level
 * detector calls `observe(isVoice)` each tick (true when sound is above a speech
 * threshold). Flipping to "voice" requires `onsetFrames` consecutive active frames
 * so a single cough or click doesn't flag talking; it returns to quiet immediately
 * when sound stops. Only the event is recorded — no audio is ever captured.
 */
export class AudioActivitySensor implements Sensor {
  private active = false;
  private onsetStreak = 0;

  constructor(
    private readonly sink: EventSink,
    private readonly onsetFrames = 2,
  ) {}

  start(): void {}
  stop(): void {
    this.active = false;
    this.onsetStreak = 0;
  }

  observe(isVoice: boolean): void {
    if (isVoice) {
      if (this.active) return;
      this.onsetStreak += 1;
      if (this.onsetStreak < this.onsetFrames) return;
      this.onsetStreak = 0;
      this.active = true;
      this.sink('audio.voice');
    } else {
      this.onsetStreak = 0;
      if (this.active) {
        this.active = false;
        this.sink('audio.quiet');
      }
    }
  }

  /** Whether voice is currently in the confirmed active state. */
  state(): boolean {
    return this.active;
  }
}
