import {
  Ledger,
  ProvenanceRecorder,
  applyAll,
  buildAuthenticityBundle,
  type AuthenticityBundle,
  type InputEventLike,
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

  constructor(
    private readonly exam: Exam,
    opts: ExamSessionOptions = {},
  ) {
    this.now = opts.now ?? Date.now;
    this.ledger = new Ledger({ now: this.now });
    for (const q of exam.questions) {
      this.recorders.set(q.id, new ProvenanceRecorder(this.now));
    }
  }

  start(): void {
    this.ledger.append('session.start', { examId: this.exam.id, questions: this.exam.questions.length });
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

  focusGained(): void {
    this.ledger.append('focus.gained');
  }

  integritySummary(): IntegritySummary {
    return {
      eventCount: this.ledger.export().length,
      focusLossCount: this.focusLossCount,
      footageStored: false,
    };
  }

  finalize(): AuthenticityBundle {
    this.ledger.append('session.submit');
    return buildAuthenticityBundle({
      ledger: this.ledger,
      answers: this.exam.questions.map((q) => ({
        id: q.id,
        ops: this.recorders.get(q.id)?.ops() ?? [],
      })),
    });
  }
}
