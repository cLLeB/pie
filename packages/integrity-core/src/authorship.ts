import type { ProvenanceMetrics } from './provenance/metrics.js';

export type AuthorshipLevel = 'ok' | 'review';

export interface AuthorshipVerdict {
  label: string;
  level: AuthorshipLevel;
}

/**
 * Turn authorship metrics into an explainable verdict. Crucially this flags the
 * *presence* of pasted content, not just a high paste ratio — so pasting
 * sentence-by-sentence (or interleaving typing to dilute the ratio) is still
 * caught, because a legitimately-typed answer essentially never contains a paste.
 * `minPaste` lets a tenant tolerate a trivial paste (e.g. a single character).
 * This is evidence for human review, never an automatic verdict.
 */
export function authorshipVerdict(m: ProvenanceMetrics, minPaste = 1): AuthorshipVerdict {
  if (m.pastedChars < minPaste) return { label: 'authored (typed)', level: 'ok' };
  if (m.typedChars === 0) return { label: 'fully pasted — review', level: 'review' };
  const pct = Math.round(m.pasteRatio * 100);
  return {
    label: `contains pasted content (${m.pastedChars} chars, ${m.pasteCount} paste${
      m.pasteCount === 1 ? '' : 's'
    }, ${pct}%) — review`,
    level: 'review',
  };
}
