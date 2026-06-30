/**
 * A single entry in the tamper-evident integrity ledger.
 *
 * Each event hashes the previous event's hash (`prevHash`), forming a chain:
 * altering any past event invalidates every hash after it, so the record is
 * tamper-evident. This is the evidentiary backbone of the Authenticity Certificate.
 */
export interface IntegrityEvent {
  /** Position in the chain, starting at 0. */
  readonly seq: number;
  /** Timestamp (ms) supplied by the ledger's clock. */
  readonly ts: number;
  /** Event kind, e.g. "session.start", "focus.lost", "answer.provenance". */
  readonly type: string;
  /** Arbitrary structured payload for this event. */
  readonly data: Record<string, unknown>;
  /** Hash of the predecessor event (or the genesis string for seq 0). */
  readonly prevHash: string;
  /** SHA-256 over the canonical form of {seq, ts, type, data, prevHash}. */
  readonly hash: string;
}
