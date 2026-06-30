import { describe, it, expect } from 'vitest';
import { signCertificate, verifyCertificate, hmacHex } from '../src/signing.js';

const fixedNow = () => 1_700_000_000_000;

describe('hmacHex', () => {
  it('is deterministic for the same secret and message', () => {
    expect(hmacHex('k', 'msg')).toBe(hmacHex('k', 'msg'));
  });
  it('changes with the secret', () => {
    expect(hmacHex('k1', 'msg')).not.toBe(hmacHex('k2', 'msg'));
  });
});

describe('signCertificate / verifyCertificate', () => {
  it('produces a certificate that verifies with the same secret', () => {
    const cert = signCertificate({ root: 'abc123' }, 'tenant-secret', fixedNow);
    expect(cert.alg).toBe('HMAC-SHA256');
    expect(cert.root).toBe('abc123');
    expect(cert.signedAt).toBe(1_700_000_000_000);
    expect(verifyCertificate(cert, 'tenant-secret')).toBe(true);
    // Cross-language contract: this exact hex must also be produced by the Python
    // server (HMAC-SHA256 over the canonical {alg,root,signedAt}). Pinned so the two
    // signers can never silently diverge.
    expect(cert.signature).toBe(
      'df5d7c2445ba2f97236d7e12743b879e4c2ae02a8b13b1dadfecb33dff567dba',
    );
  });

  it('fails verification under a different secret', () => {
    const cert = signCertificate({ root: 'abc123' }, 'tenant-secret', fixedNow);
    expect(verifyCertificate(cert, 'wrong-secret')).toBe(false);
  });

  it('fails verification if the signed root is altered', () => {
    const cert = signCertificate({ root: 'abc123' }, 'tenant-secret', fixedNow);
    const tampered = { ...cert, root: 'def456' };
    expect(verifyCertificate(tampered, 'tenant-secret')).toBe(false);
  });

  it('fails verification if the signedAt is altered', () => {
    const cert = signCertificate({ root: 'abc123' }, 'tenant-secret', fixedNow);
    const tampered = { ...cert, signedAt: cert.signedAt + 1 };
    expect(verifyCertificate(tampered, 'tenant-secret')).toBe(false);
  });
});
