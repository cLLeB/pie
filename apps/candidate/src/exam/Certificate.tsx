import {
  serializeCertificatePackage,
  authorshipVerdict,
  type AnswerSummary,
  type AuthenticityBundle,
  type SignedCertificate,
} from '@pie/integrity-core';

function downloadPackage(bundle: AuthenticityBundle, cert: SignedCertificate): void {
  const blob = new Blob([serializeCertificatePackage(bundle, cert)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pie-certificate-${cert.root.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

interface AnswerRow {
  detail: string;
  assessment: string;
  cls: 'ok' | 'warn';
}

/** Per-answer evidence — kind-aware: text uses authorship, choice uses response provenance. */
function answerRow(a: AnswerSummary): AnswerRow {
  if (a.kind === 'choice') {
    const value = a.choice?.value ?? '(no answer)';
    const secs = ((a.choice?.latencyMs ?? 0) / 1000).toFixed(1);
    const changes = a.choice?.changes ?? 0;
    const changeText = changes > 0 ? `, ${changes} change${changes === 1 ? '' : 's'}` : '';
    return { detail: `selected “${value}”`, assessment: `answered in ${secs}s${changeText}`, cls: 'ok' };
  }
  const verdict = authorshipVerdict(a.metrics);
  const pct = (a.metrics.pasteRatio * 100).toFixed(0);
  return {
    detail: `typed ${a.metrics.typedChars} · pasted ${a.metrics.pastedChars} (${pct}%)`,
    assessment: verdict.label,
    cls: verdict.level === 'ok' ? 'ok' : 'warn',
  };
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
            <th>Kind</th>
            <th>Detail</th>
            <th>Assessment</th>
          </tr>
        </thead>
        <tbody>
          {bundle.answers.map((a) => {
            const row = answerRow(a);
            return (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.kind}</td>
                <td>{row.detail}</td>
                <td className={row.cls}>{row.assessment}</td>
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
