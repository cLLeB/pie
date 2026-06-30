import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { canonicalize } from './hash.js';

/** Hex-encoded HMAC-SHA256 of `message` under `secret`. */
export function hmacHex(secret: string, message: string): string {
  const enc = new TextEncoder();
  return bytesToHex(hmac(sha256, enc.encode(secret), enc.encode(message)));
}

/**
 * A signed Authenticity Certificate header. The server signs the ledger's chain
 * root with the tenant's secret (the same HMAC pattern the biometric engine uses
 * to sign verify results), so a certificate is independently checkable and cannot
 * be forged or back-dated without the secret.
 */
export interface SignedCertificate {
  root: string;
  alg: 'HMAC-SHA256';
  signedAt: number;
  signature: string;
}

const ALG = 'HMAC-SHA256' as const;

/** Sign a bundle's chain root, binding the signing time into the signature. */
export function signCertificate(
  input: { root: string },
  secret: string,
  now: () => number = Date.now,
): SignedCertificate {
  const signedAt = now();
  const signature = hmacHex(secret, canonicalize({ root: input.root, alg: ALG, signedAt }));
  return { root: input.root, alg: ALG, signedAt, signature };
}

/** Constant-time-ish equality for equal-length hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Recompute the signature and confirm it matches (and was not back-dated). */
export function verifyCertificate(cert: SignedCertificate, secret: string): boolean {
  const expected = hmacHex(
    secret,
    canonicalize({ root: cert.root, alg: cert.alg, signedAt: cert.signedAt }),
  );
  return safeEqual(expected, cert.signature);
}
