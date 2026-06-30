import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { buildAuthenticityBundle } from '../src/bundle.js';
import { signCertificate } from '../src/signing.js';
import { serializeCertificatePackage, parseCertificatePackage } from '../src/package-io.js';
import { verifySignedBundle } from '../src/verify.js';
import type { EditOp } from '../src/provenance/ops.js';

function makePackage() {
  let t = 0;
  const ledger = new Ledger({ now: () => (t += 1) });
  ledger.append('session.start');
  const ops: EditOp[] = [
    { t: 1, kind: 'insert', pos: 0, text: 'h' },
    { t: 2, kind: 'insert', pos: 1, text: 'i' },
  ];
  const bundle = buildAuthenticityBundle({ ledger, answers: [{ id: 'q1', ops }] });
  const cert = signCertificate({ root: bundle.root }, 's3cret', () => 1700000000000);
  return { bundle, cert };
}

describe('certificate package IO', () => {
  it('round-trips a package through serialize → parse with the chain intact', () => {
    const { bundle, cert } = makePackage();
    const json = serializeCertificatePackage(bundle, cert);
    const parsed = parseCertificatePackage(json);
    expect(parsed.bundle.root).toBe(bundle.root);
    expect(parsed.cert.signature).toBe(cert.signature);
    expect(verifySignedBundle({ bundle: parsed.bundle, cert: parsed.cert, secret: 's3cret' }).ok).toBe(true);
  });

  it('embeds a format version', () => {
    const { bundle, cert } = makePackage();
    const parsed = JSON.parse(serializeCertificatePackage(bundle, cert));
    expect(parsed.format).toBe('pie-certificate-v1');
  });

  it('throws a clear error on malformed JSON', () => {
    expect(() => parseCertificatePackage('not json')).toThrow(/invalid/i);
  });

  it('throws when required fields are missing', () => {
    expect(() => parseCertificatePackage(JSON.stringify({ format: 'pie-certificate-v1' }))).toThrow(
      /missing/i,
    );
  });
});
