import {
  Ledger,
  ProvenanceRecorder,
  FacePresenceSensor,
  GazeSensor,
  AudioActivitySensor,
  applyAll,
  buildAuthenticityBundle,
  type AuthenticityBundle,
  type InputEventLike,
  type PresenceState,
} from '@pie/integrity-core';
import type { Exam } from './types';

export interface ExamSessionOptions {
  now?: () => number;
}

export interface IntegritySummary {
  /** Total integrity events recorded so far. */
  eventCount: number;
  /** How many times the candidate left the exam surface. */
  focusLossCount: number;
  /** Whether any video/screen footage is being stored. Always false: on-device, flags-not-footage. */
  footageStored: boolean;
  /** Number of continuous-identity checks performed. */
  identityChecks: number;
  /** Result of the most recent identity check (null if none yet). */
  lastIdentityMatch: boolean | null;
  /** Debounced face presence (null if the camera is off). */
  facePresence: PresenceState | null;
  /** Whether the candidate is currently looking away (only meaningful with camera on). */
  gazeOffScreen: boolean;
  /** Whether voice is currently detected (null if the microphone is off). */
  voiceActive: boolean | null;
}

/**
 * Framework-agnostic exam session. Owns the integrity ledger, a per-question
 * provenance recorder, and the finalize → AuthenticityBundle path. The React
 * layer is a thin wrapper over this, so all the integrity logic is unit-tested
 * without a DOM.
 */
export class ExamSession {
  readonly ledger: Ledger;
  private readonly recorders = new Map<string, ProvenanceRecorder>();
  private readonly now: () => number;
  private focusLossCount = 0;
  private identityChecks = 0;
  private lastIdentityMatch: boolean | null = null;
  private startedAt = 0;
  private readonly facePresence: FacePresenceSensor;
  private readonly gaze: GazeSensor;
  private readonly audio: AudioActivitySensor;
  private micOn = false;
  /** Per-choice-question selection history: timestamps + values. */
  private readonly choices = new Map<string, { value: string; t: number }[]>();

  constructor(
    private readonly exam: Exam,
    opts: ExamSessionOptions = {},
  ) {
    this.now = opts.now ?? Date.now;
    this.ledger = new Ledger({ now: this.now });
    this.facePresence = new FacePresenceSensor((type, data) => this.ledger.append(type, data));
    this.gaze = new GazeSensor((type, data) => this.ledger.append(type, data));
    // Require ~1s of sustained sound (4 ticks @ 250ms) before flagging voice, so a
    // brief cough or distant noise is ignored.
    this.audio = new AudioActivitySensor((type, data) => this.ledger.append(type, data), 4);
    for (const q of exam.questions) {
      this.recorders.set(q.id, new ProvenanceRecorder(this.now));
    }
  }

  /** Feed a detected face count from the on-device detector (camera tick). */
  observeFaceCount(count: number): void {
    this.facePresence.observe(count);
  }

  /** Feed whether the candidate's gaze is on the screen (camera tick). */
  observeGaze(onScreen: boolean): void {
    this.gaze.observe(onScreen);
  }

  /** Feed whether voice is detected this tick (microphone). */
  observeAudio(isVoice: boolean): void {
    this.micOn = true;
    this.audio.observe(isVoice);
  }

  start(): void {
    this.startedAt = this.now();
    this.ledger.append('session.start', {
      examId: this.exam.id,
      questions: this.exam.questions.length,
    });
  }

  /** Record a selection on an objective (choice) question. */
  recordChoice(questionId: string, value: string): void {
    const t = this.now();
    const history = this.choices.get(questionId) ?? [];
    history.push({ value, t });
    this.choices.set(questionId, history);
    this.ledger.append('answer.choice', { questionId, value });
  }

  recordInput(questionId: string, e: InputEventLike): void {
    this.recorders.get(questionId)?.onInput(e);
  }

  answerText(questionId: string): string {
    return applyAll(this.recorders.get(questionId)?.ops() ?? []);
  }

  /** Append an arbitrary integrity event (sensor signals, choice answers, etc.). */
  logEvent(type: string, data: Record<string, unknown> = {}): void {
    this.ledger.append(type, data);
  }

  focusLost(): void {
    this.focusLossCount += 1;
    this.ledger.append('focus.lost');
  }

  /**
   * Record a continuous-identity check result (from the biometric `/v1` engine via
   * the server). Binding it into the hash-chained ledger is what makes the "same
   * verified person throughout" claim part of the tamper-evident certificate.
   */
  recordIdentityCheck(match: boolean, score: number): void {
    this.identityChecks += 1;
    this.lastIdentityMatch = match;
    this.ledger.append(match ? 'identity.verified' : 'identity.mismatch', { score });
  }

  focusGained(): void {
    this.ledger.append('focus.gained');
  }

  integritySummary(): IntegritySummary {
    return {
      eventCount: this.ledger.export().length,
      focusLossCount: this.focusLossCount,
      footageStored: false,
      identityChecks: this.identityChecks,
      lastIdentityMatch: this.lastIdentityMatch,
      facePresence: this.facePresence.state(),
      gazeOffScreen: this.gaze.isOffScreen(),
      voiceActive: this.micOn ? this.audio.state() : null,
    };
  }

  finalize(): AuthenticityBundle {
    this.ledger.append('session.submit');
    return buildAuthenticityBundle({
      ledger: this.ledger,
      answers: this.exam.questions.map((q) => {
        if (q.kind === 'choice') {
          const history = this.choices.get(q.id) ?? [];
          return {
            id: q.id,
            ops: [],
            kind: 'choice' as const,
            choice: {
              value: history.length > 0 ? history[history.length - 1]!.value : null,
              latencyMs: history.length > 0 ? history[0]!.t - this.startedAt : 0,
              changes: Math.max(0, history.length - 1),
            },
          };
        }
        return { id: q.id, ops: this.recorders.get(q.id)?.ops() ?? [], kind: 'text' as const };
      }),
    });
  }
}
