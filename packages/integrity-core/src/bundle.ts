import { Ledger, verifyChain } from './ledger.js';
import type { IntegrityEvent } from './events.js';
import { provenanceMetrics, type ProvenanceMetrics } from './provenance/metrics.js';
import type { EditOp } from './provenance/ops.js';

export type AnswerKind = 'text' | 'choice';

/** Response provenance for an objective (choice) question. */
export interface ChoiceProvenance {
  /** The finally-selected option (null if never answered). */
  value: string | null;
  /** Time from session start to the first selection, in ms. */
  latencyMs: number;
  /** How many times the selection changed (0 = answered once, no changes). */
  changes: number;
}

export interface AnswerProvenance {
  id: string;
  ops: EditOp[];
  /** Defaults to 'text'. 'choice' answers use ChoiceProvenance, not keystroke ops. */
  kind?: AnswerKind;
  choice?: ChoiceProvenance;
}

export interface AnswerSummary {
  id: string;
  kind: AnswerKind;
  metrics: ProvenanceMetrics;
  /** Raw provenance ops — the evidence that powers authorship replay downstream. */
  ops: EditOp[];
  /** Present for 'choice' answers. */
  choice?: ChoiceProvenance;
}

/**
 * The unsigned payload of an Authenticity Certificate. `root` is the chain head
 * the server will HMAC-sign (the biometric engine already signs results, so this
 * is a clean seam). `verified` confirms the exported chain is internally intact at
 * assembly time. Per-answer metrics carry the authorship evidence — never a verdict.
 */
export interface AuthenticityBundle {
  root: string;
  events: IntegrityEvent[];
  answers: AnswerSummary[];
  verified: boolean;
}

export function buildAuthenticityBundle(input: {
  ledger: Ledger;
  answers: AnswerProvenance[];
}): AuthenticityBundle {
  const events = input.ledger.export();
  return {
    root: input.ledger.root(),
    events,
    answers: input.answers.map((a) => ({
      id: a.id,
      kind: a.kind ?? 'text',
      metrics: provenanceMetrics(a.ops),
      ops: a.ops.map((op) => ({ ...op })),
      ...(a.choice ? { choice: { ...a.choice } } : {}),
    })),
    verified: verifyChain(events).ok,
  };
}
