import type { IntegrityEvent } from './events.js';
import type { AnswerSummary } from './bundle.js';

export type Severity = 'low' | 'medium' | 'high';

export interface IntegrityFlag {
  code: string;
  severity: Severity;
  detail: string;
  /** Timestamp the flag relates to, when applicable. */
  at?: number;
}

export interface FusionOptions {
  /** A paste within this many ms after leaving the exam surface is correlated. */
  pasteAfterFocusMs: number;
  /** A choice answered faster than this (ms from start) is suspiciously quick. */
  fastChoiceMs: number;
  /** More focus losses than this is flagged. */
  maxFocusLoss: number;
  /** Pasted-char count at or above this flags an answer. */
  minPaste: number;
  /** More off-screen gaze episodes than this is flagged. */
  maxGazeOffScreen: number;
  /** More voice episodes than this is flagged. */
  maxVoiceEpisodes: number;
}

export const DEFAULT_FUSION_OPTIONS: FusionOptions = {
  pasteAfterFocusMs: 15_000,
  fastChoiceMs: 1_500,
  maxFocusLoss: 3,
  minPaste: 1,
  maxGazeOffScreen: 3,
  maxVoiceEpisodes: 2,
};

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

const FOCUS_LOSS_TYPES = new Set(['focus.lost', 'visibility.hidden']);

/**
 * Weak-signal fusion: turns the raw event ledger and per-answer provenance into a
 * ranked list of explainable integrity flags. This is the layer that catches the
 * *combinations* single signals miss — most importantly a paste arriving moments
 * after the candidate left the exam surface (looked it up, came back, pasted).
 * Flags are evidence for human review, never an automatic verdict.
 */
export function analyzeIntegrity(
  input: { events: IntegrityEvent[]; answers: AnswerSummary[] },
  options: Partial<FusionOptions> = {},
): IntegrityFlag[] {
  const opts = { ...DEFAULT_FUSION_OPTIONS, ...options };
  const flags: IntegrityFlag[] = [];

  const focusLossTimes = input.events
    .filter((e) => FOCUS_LOSS_TYPES.has(e.type))
    .map((e) => e.ts);

  // Paste correlated with a recent departure from the exam surface.
  for (const e of input.events) {
    if (e.type !== 'clipboard.paste') continue;
    const recentDeparture = focusLossTimes.some(
      (t) => t <= e.ts && e.ts - t <= opts.pasteAfterFocusMs,
    );
    if (recentDeparture) {
      flags.push({
        code: 'paste-after-focus-loss',
        severity: 'high',
        detail: 'Content was pasted shortly after the candidate left the exam surface.',
        at: e.ts,
      });
    }
  }

  // Identity mismatches.
  for (const e of input.events) {
    if (e.type === 'identity.mismatch') {
      flags.push({
        code: 'identity-mismatch',
        severity: 'high',
        detail: 'A continuous-identity check did not match the enrolled person.',
        at: e.ts,
      });
    }
  }

  // Excessive departures from the exam surface.
  const focusLossCount = input.events.filter((e) => e.type === 'focus.lost').length;
  if (focusLossCount > opts.maxFocusLoss) {
    flags.push({
      code: 'excessive-focus-loss',
      severity: 'medium',
      detail: `Left the exam surface ${focusLossCount} times.`,
    });
  }

  // Repeated off-screen gaze episodes.
  const gazeOffCount = input.events.filter((e) => e.type === 'gaze.offscreen').length;
  if (gazeOffCount > opts.maxGazeOffScreen) {
    flags.push({
      code: 'frequent-look-away',
      severity: 'medium',
      detail: `Looked away from the screen ${gazeOffCount} times.`,
    });
  }

  // Repeated voice episodes (talking / being coached).
  const voiceCount = input.events.filter((e) => e.type === 'audio.voice').length;
  if (voiceCount > opts.maxVoiceEpisodes) {
    flags.push({
      code: 'frequent-voice',
      severity: 'medium',
      detail: `Voice was detected ${voiceCount} times.`,
    });
  }

  // Per-answer flags.
  for (const a of input.answers) {
    if (a.kind === 'text' && a.metrics.pastedChars >= opts.minPaste) {
      const fully = a.metrics.typedChars === 0;
      flags.push({
        code: 'pasted-content',
        severity: fully ? 'high' : 'medium',
        detail: `Answer ${a.id} contains ${a.metrics.pastedChars} pasted characters across ${a.metrics.pasteCount} paste(s).`,
      });
    }
    if (a.kind === 'choice' && a.choice && a.choice.latencyMs > 0 && a.choice.latencyMs < opts.fastChoiceMs) {
      flags.push({
        code: 'fast-choice',
        severity: 'low',
        detail: `Answer ${a.id} was selected in ${(a.choice.latencyMs / 1000).toFixed(1)}s.`,
      });
    }
  }

  return flags.sort((x, y) => SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity]);
}
