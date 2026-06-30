import { verifyChain } from './ledger.js';
import { verifyCertificate, type SignedCertificate } from './signing.js';
import type { AuthenticityBundle } from './bundle.js';

export interface SignedBundleVerification {
  /** The hash chain is internally intact (no event altered). */
  chainOk: boolean;
  /** The signed root matches the bundle's chain root. */
  rootMatches: boolean;
  /** The signature is valid under the supplied secret. */
  signatureOk: boolean;
  /** All checks passed. */
  ok: boolean;
}

/**
 * Independently verify an Authenticity Certificate: the chain is untampered, the
 * signed root matches the chain, and the signature checks out under the tenant
 * secret. This is what a review console (or any third party with the secret) runs
 * to trust a certificate — the basis for "evidence, not accusation".
 */
export function verifySignedBundle(input: {
  bundle: AuthenticityBundle;
  cert: SignedCertificate;
  secret: string;
}): SignedBundleVerification {
  const chainOk = verifyChain(input.bundle.events).ok;
  const rootMatches = input.bundle.root === input.cert.root;
  const signatureOk = verifyCertificate(input.cert, input.secret);
  return { chainOk, rootMatches, signatureOk, ok: chainOk && rootMatches && signatureOk };
}
