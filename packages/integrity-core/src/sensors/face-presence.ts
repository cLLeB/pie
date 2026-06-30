import type { EventSink, Sensor } from './sensor.js';

export type PresenceState = 'absent' | 'present' | 'multiple';

/** Map a detected face count to a presence state. */
export function presenceState(count: number): PresenceState {
  if (count <= 0) return 'absent';
  if (count === 1) return 'present';
  return 'multiple';
}

/**
 * Continuous face-presence signal with absence debouncing. An on-device detector
 * (MediaPipe/ONNX) calls `observe(count)` each frame; the sensor emits only on a
 * *confirmed* state change. Crucially, flipping to "absent" requires `absenceFrames`
 * consecutive empty frames, so a momentary detection drop — leaning in to read,
 * turning the head, a single bad frame — does not falsely report "no face".
 * A face (re)appearing registers immediately.
 */
export class FacePresenceSensor implements Sensor {
  private confirmed: PresenceState | null = null;
  private absentStreak = 0;

  constructor(
    private readonly sink: EventSink,
    private readonly absenceFrames = 3,
  ) {}

  start(): void {}
  stop(): void {
    this.confirmed = null;
    this.absentStreak = 0;
  }

  observe(count: number): void {
    const raw = presenceState(count);
    if (raw === this.confirmed) {
      this.absentStreak = 0;
      return;
    }
    if (raw === 'absent') {
      this.absentStreak += 1;
      if (this.absentStreak < this.absenceFrames) return; // tolerate a brief loss
      this.absentStreak = 0;
    } else {
      this.absentStreak = 0;
    }
    this.confirmed = raw;
    this.sink(`face.${raw}`, { count });
  }

  /** The current confirmed presence state (null until the first confirmed reading). */
  state(): PresenceState | null {
    return this.confirmed;
  }
}
