/**
 * The message contract between the optional PIE browser extension and the exam
 * page. The extension can see signals a sandboxed page cannot (multi-monitor,
 * other windows, process hints) and relays them to the page via window.postMessage;
 * the page validates and feeds them into the integrity ledger. Defined in the core
 * so the extension and the candidate app share one source of truth.
 */

export const PIE_EXT_SOURCE = 'pie-extension';

export interface ExtensionMessage {
  source: typeof PIE_EXT_SOURCE;
  type: string;
  data: Record<string, unknown>;
}

export function buildMessage(type: string, data: Record<string, unknown> = {}): ExtensionMessage {
  return { source: PIE_EXT_SOURCE, type, data };
}

/** Validate an untrusted postMessage payload; returns null if it isn't ours. */
export function parseMessage(raw: unknown): ExtensionMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const m = raw as Record<string, unknown>;
  if (m.source !== PIE_EXT_SOURCE || typeof m.type !== 'string') return null;
  const data = typeof m.data === 'object' && m.data !== null ? (m.data as Record<string, unknown>) : {};
  return { source: PIE_EXT_SOURCE, type: m.type, data };
}

export interface ScreenLike {
  isExtended?: boolean;
}

/** Map the current screen state to extension messages (e.g. a second display). */
export function collectScreenSignals(screen: ScreenLike): ExtensionMessage[] {
  return screen.isExtended ? [buildMessage('screen.multi_monitor', { isExtended: true })] : [];
}
