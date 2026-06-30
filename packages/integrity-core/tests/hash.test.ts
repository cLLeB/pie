import { describe, it, expect } from 'vitest';
import { canonicalize, sha256Hex } from '../src/hash.js';

describe('canonicalize', () => {
  it('is order-independent for object keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it('sorts nested keys but preserves array order', () => {
    expect(canonicalize({ z: { d: 1, c: 2 }, a: [3, 1, 2] })).toBe(
      '{"a":[3,1,2],"z":{"c":2,"d":1}}',
    );
  });

  it('produces different output for different values', () => {
    expect(canonicalize({ a: 1 })).not.toBe(canonicalize({ a: 2 }));
  });
});

describe('sha256Hex', () => {
  it('matches the known NIST vector for "abc"', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the known vector for the empty string', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
