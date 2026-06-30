import { describe, it, expect } from 'vitest';
import {
  PIE_EXT_SOURCE,
  buildMessage,
  parseMessage,
  collectScreenSignals,
} from '../src/extension.js';

describe('extension protocol', () => {
  it('builds a message tagged with the PIE source', () => {
    expect(buildMessage('screen.multi_monitor', { isExtended: true })).toEqual({
      source: PIE_EXT_SOURCE,
      type: 'screen.multi_monitor',
      data: { isExtended: true },
    });
  });

  it('parses a valid message and rejects foreign or malformed payloads', () => {
    const good = buildMessage('x', { a: 1 });
    expect(parseMessage(good)).toEqual(good);
    expect(parseMessage({ source: 'evil.com', type: 'x' })).toBeNull();
    expect(parseMessage({ source: PIE_EXT_SOURCE })).toBeNull(); // no type
    expect(parseMessage('nope')).toBeNull();
    expect(parseMessage(null)).toBeNull();
  });

  it('emits a multi-monitor signal only when a second display is present', () => {
    expect(collectScreenSignals({ isExtended: true })).toHaveLength(1);
    expect(collectScreenSignals({ isExtended: false })).toEqual([]);
    expect(collectScreenSignals({})).toEqual([]);
  });
});
