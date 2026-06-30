import type { AuthenticityBundle } from './bundle.js';
import type { SignedCertificate } from './signing.js';

const FORMAT = 'pie-certificate-v1';

export interface CertificatePackage {
  format: typeof FORMAT;
  bundle: AuthenticityBundle;
  cert: SignedCertificate;
}

/** Serialize a bundle + signature into a portable certificate package (JSON). */
export function serializeCertificatePackage(
  bundle: AuthenticityBundle,
  cert: SignedCertificate,
): string {
  const pkg: CertificatePackage = { format: FORMAT, bundle, cert };
  return JSON.stringify(pkg, null, 2);
}

/**
 * Parse and validate a certificate package. Validation is strict at the trust
 * boundary: malformed JSON or missing fields throw, rather than producing a
 * half-formed object a verifier might mis-handle.
 */
export function parseCertificatePackage(json: string): { bundle: AuthenticityBundle; cert: SignedCertificate } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid certificate package: not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid certificate package: expected an object');
  }
  const p = parsed as Record<string, unknown>;
  if (p.format !== FORMAT) {
    throw new Error(`Invalid certificate package: unknown format ${String(p.format)}`);
  }
  if (typeof p.bundle !== 'object' || p.bundle === null) {
    throw new Error('Invalid certificate package: missing "bundle"');
  }
  if (typeof p.cert !== 'object' || p.cert === null) {
    throw new Error('Invalid certificate package: missing "cert"');
  }
  return { bundle: p.bundle as AuthenticityBundle, cert: p.cert as SignedCertificate };
}
