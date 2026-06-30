import { canonicalize, sha256Hex } from './hash.js';
import type { IntegrityEvent } from './events.js';

const DEFAULT_GENESIS = 'GENESIS';

export interface LedgerOptions {
  /** Seed for the first event's prevHash. Defaults to "GENESIS". */
  genesis?: string;
  /** Clock injection for deterministic tests. Defaults to Date.now. */
  now?: () => number;
}

/** Recompute the hash an event should have, given its content. */
function hashEvent(e: Pick<IntegrityEvent, 'seq' | 'ts' | 'type' | 'data' | 'prevHash'>): string {
  return sha256Hex(
    canonicalize({ seq: e.seq, ts: e.ts, type: e.type, data: e.data, prevHash: e.prevHash }),
  );
}

/**
 * Append-only, hash-chained ledger of integrity events. Events cannot be edited
 * once appended; the chain makes any later alteration detectable via verifyChain.
 */
export class Ledger {
  private readonly events: IntegrityEvent[] = [];
  private readonly genesis: string;
  private readonly now: () => number;

  constructor(opts: LedgerOptions = {}) {
    this.genesis = opts.genesis ?? DEFAULT_GENESIS;
    this.now = opts.now ?? Date.now;
  }

  /** Append a new event and return it. */
  append(type: string, data: Record<string, unknown> = {}, ts?: number): IntegrityEvent {
    const seq = this.events.length;
    const prevHash = seq === 0 ? this.genesis : this.events[seq - 1]!.hash;
    const stamp = ts ?? this.now();
    const base = { seq, ts: stamp, type, data, prevHash };
    const event: IntegrityEvent = { ...base, hash: hashEvent(base) };
    this.events.push(event);
    return event;
  }

  /** Hash of the most recent event, or the genesis string if empty. */
  root(): string {
    return this.events.length === 0 ? this.genesis : this.events[this.events.length - 1]!.hash;
  }

  /** Defensive copy of the full chain. */
  export(): IntegrityEvent[] {
    return this.events.map((e) => ({ ...e }));
  }
}

export interface VerifyResult {
  ok: boolean;
  /** Index of the first event whose hash or link is invalid, when ok is false. */
  brokenAt?: number;
}

/** Recompute the chain and confirm every hash and link is intact. */
export function verifyChain(events: IntegrityEvent[], genesis: string = DEFAULT_GENESIS): VerifyResult {
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    const expectedPrev = i === 0 ? genesis : events[i - 1]!.hash;
    if (e.prevHash !== expectedPrev) {
      return { ok: false, brokenAt: i };
    }
    if (e.hash !== hashEvent(e)) {
      return { ok: false, brokenAt: i };
    }
  }
  return { ok: true };
}
