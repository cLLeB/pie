import { Ledger, verifyChain } from './ledger.js';
import type { IntegrityEvent } from './events.js';
import { provenanceMetrics, type ProvenanceMetrics } from './provenance/metrics.js';
import type { EditOp } from './provenance/ops.js';

export interface AnswerProvenance {
  id: string;
  ops: EditOp[];
}

export interface AnswerSummary {
  id: string;
  metrics: ProvenanceMetrics;
  /** Raw provenance ops — the evidence that powers authorship replay downstream. */
  ops: EditOp[];
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
      metrics: provenanceMetrics(a.ops),
      ops: a.ops.map((op) => ({ ...op })),
    })),
    verified: verifyChain(events).ok,
  };
}
