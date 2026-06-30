import { describe, it, expect } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { buildAuthenticityBundle } from '../src/bundle.js';
import { signCertificate } from '../src/signing.js';
import { verifySignedBundle } from '../src/verify.js';

const SECRET = 'tenant-secret';
const now = () => 1_700_000_000_000;

function makeSigned() {
  const led = new Ledger({ now: (() => { let t = 0; return () => (t += 1); })() });
  led.append('session.start');
  led.append('focus.lost');
  const bundle = buildAuthenticityBundle({ ledger: led, answers: [] });
  const cert = signCertificate({ root: bundle.root }, SECRET, now);
  return { bundle, cert };
}

describe('verifySignedBundle', () => {
  it('passes for an intact, correctly-signed bundle', () => {
    const { bundle, cert } = makeSigned();
    expect(verifySignedBundle({ bundle, cert, secret: SECRET })).toEqual({
      chainOk: true,
      rootMatches: true,
      signatureOk: true,
      ok: true,
    });
  });

  it('fails signatureOk under the wrong secret', () => {
    const { bundle, cert } = makeSigned();
    const r = verifySignedBundle({ bundle, cert, secret: 'nope' });
    expect(r.signatureOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('fails chainOk and rootMatches when an event is tampered', () => {
    const { bundle, cert } = makeSigned();
    (bundle.events[0] as { data: Record<string, unknown> }).data = { hacked: true };
    const r = verifySignedBundle({ bundle, cert, secret: SECRET });
    expect(r.chainOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('fails rootMatches when the bundle root and cert root disagree', () => {
    const { bundle, cert } = makeSigned();
    const r = verifySignedBundle({ bundle, cert: { ...cert, root: 'different' }, secret: SECRET });
    expect(r.rootMatches).toBe(false);
    expect(r.ok).toBe(false);
  });
});
