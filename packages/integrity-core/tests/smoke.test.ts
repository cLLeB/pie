import { describe, it, expect } from 'vitest';
import { INTEGRITY_CORE_VERSION } from '../src/index.js';

describe('smoke', () => {
  it('arithmetic works', () => {
    expect(1 + 1).toBe(2);
  });

  it('package exports a version', () => {
    expect(INTEGRITY_CORE_VERSION).toBe('0.0.1');
  });
});
