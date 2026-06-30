import { serializeCertificatePackage, type AuthenticityBundle, type SignedCertificate } from '@pie/integrity-core';

function downloadPackage(bundle: AuthenticityBundle, cert: SignedCertificate): void {
  const blob = new Blob([serializeCertificatePackage(bundle, cert)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pie-certificate-${cert.root.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function ratioLabel(ratio: number): { text: string; cls: string } {
  if (ratio === 0) return { text: 'fully authored (typed)', cls: 'ok' };
  if (ratio < 0.5) return { text: 'mostly authored', cls: 'ok' };
  if (ratio < 1) return { text: 'mixed — review', cls: 'warn' };
  return { text: 'fully pasted — review', cls: 'warn' };
}

/**
 * Renders the Authenticity Certificate produced at submission: the tamper-evident
 * chain root, the verification result, and per-answer authorship evidence. This is
 * the artifact PIE issues instead of a suspicion score — evidence, not a verdict.
 */
export function Certificate({
  bundle,
  signedCert,
}: {
  bundle: AuthenticityBundle;
  signedCert?: SignedCertificate | null;
}) {
  return (
    <section className="certificate" aria-label="Authenticity Certificate">
      <h2>Authenticity Certificate</h2>
      <p className={`cert-status ${bundle.verified ? 'ok' : 'warn'}`}>
        {bundle.verified ? 'Chain verified — record is intact ✓' : 'Chain broken — tampering detected ✗'}
      </p>
      <dl className="cert-meta">
        <dt>Chain root</dt>
        <dd>
          <code>{bundle.root.slice(0, 24)}…</code>
        </dd>
        <dt>Integrity events</dt>
        <dd>{bundle.events.length}</dd>
        {signedCert && (
          <>
            <dt>Signature ({signedCert.alg})</dt>
            <dd>
              <code>{signedCert.signature.slice(0, 24)}…</code>
            </dd>
          </>
        )}
      </dl>
      <h3>Per-answer authorship</h3>
      <table className="cert-answers">
        <thead>
          <tr>
            <th>Answer</th>
            <th>Typed</th>
            <th>Pasted</th>
            <th>Paste ratio</th>
            <th>Assessment</th>
          </tr>
        </thead>
        <tbody>
          {bundle.answers.map((a) => {
            const label = ratioLabel(a.metrics.pasteRatio);
            return (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.metrics.typedChars}</td>
                <td>{a.metrics.pastedChars}</td>
                <td>{(a.metrics.pasteRatio * 100).toFixed(0)}%</td>
                <td className={label.cls}>{label.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {signedCert && (
        <button className="submit" onClick={() => downloadPackage(bundle, signedCert)}>
          Download certificate
        </button>
      )}
      <p className="cert-note">
        Authorship metrics are evidence for human review, never an automatic accusation.
      </p>
    </section>
  );
}
