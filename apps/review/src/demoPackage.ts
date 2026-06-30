import {
  Ledger,
  buildAuthenticityBundle,
  signCertificate,
  type EditOp,
  type AuthenticityBundle,
  type SignedCertificate,
} from '@pie/integrity-core';

export interface CertificatePackage {
  bundle: AuthenticityBundle;
  cert: SignedCertificate;
  secret: string;
}

const DEMO_SECRET = 'pie-demo-tenant-secret';

/** Build insert ops that spell `text`, one char at a time, with rising timestamps. */
function typed(text: string, startT = 100, gap = 180): EditOp[] {
  return [...text].map((ch, i) => ({ t: startT + i * gap, kind: 'insert', pos: i, text: ch }));
}

/** A real, internally-consistent signed package so the console works out of the box. */
function build(): CertificatePackage {
  let t = 0;
  const ledger = new Ledger({ now: () => (t += 50) });
  ledger.append('session.start', { examId: 'pie-demo-001' });
  ledger.append('focus.lost');
  ledger.append('focus.gained');

  const answers = [
    { id: 'q1', ops: typed('Provenance beats detection.') },
    { id: 'q3', ops: [{ t: 200, kind: 'paste', pos: 0, text: 'A pasted AI-written paragraph.' }] as EditOp[] },
  ];

  const bundle = buildAuthenticityBundle({ ledger, answers });
  const cert = signCertificate({ root: bundle.root }, DEMO_SECRET);
  return { bundle, cert, secret: DEMO_SECRET };
}

export const demoPackage: CertificatePackage = build();
