import { useMemo, useState } from 'react';
import { verifySignedBundle } from '@pie/integrity-core';
import { Replay } from './Replay';
import { demoPackage, type CertificatePackage } from './demoPackage';

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className={ok ? 'ok' : 'warn'}>
      {ok ? '✓' : '✗'} {label}
    </li>
  );
}

function assessment(pasteRatio: number): { text: string; cls: string } {
  if (pasteRatio === 0) return { text: 'authored (typed)', cls: 'ok' };
  if (pasteRatio < 1) return { text: 'mixed — review', cls: 'warn' };
  return { text: 'pasted — review', cls: 'warn' };
}

export function ReviewConsole({ pkg = demoPackage }: { pkg?: CertificatePackage }) {
  const [active, setActive] = useState<CertificatePackage>(pkg);
  const result = useMemo(
    () => verifySignedBundle({ bundle: active.bundle, cert: active.cert, secret: active.secret }),
    [active],
  );

  return (
    <div className="review">
      <header className="review-header">
        <h1>PIE Review Console</h1>
        <span className="badge">Verify · Replay</span>
      </header>

      <section className={`verdict ${result.ok ? 'ok-box' : 'warn-box'}`} aria-label="Verification result">
        <h2>{result.ok ? 'Certificate verified' : 'Certificate FAILED verification'}</h2>
        <ul className="checks">
          <Check label="Hash chain intact (no event tampered)" ok={result.chainOk} />
          <Check label="Signed root matches chain root" ok={result.rootMatches} />
          <Check label="Signature valid under tenant secret" ok={result.signatureOk} />
        </ul>
        <p className="chain-root">
          root <code>{active.bundle.root.slice(0, 28)}…</code> · {active.bundle.events.length} events
        </p>
        <button
          className="tamper"
          onClick={() =>
            setActive((p) => {
              const events = p.bundle.events.map((e) => ({ ...e }));
              if (events[0]) (events[0] as { data: Record<string, unknown> }).data = { hacked: true };
              return { ...p, bundle: { ...p.bundle, events } };
            })
          }
        >
          Simulate tampering
        </button>
      </section>

      <section className="answers" aria-label="Answers">
        <h2>Answers</h2>
        {active.bundle.answers.map((a) => {
          const verdict = assessment(a.metrics.pasteRatio);
          return (
            <article key={a.id} className="answer">
              <div className="answer-head">
                <strong>{a.id}</strong>
                <span>
                  typed {a.metrics.typedChars} · pasted {a.metrics.pastedChars} ·{' '}
                  {(a.metrics.pasteRatio * 100).toFixed(0)}% paste
                </span>
                <span className={verdict.cls}>{verdict.text}</span>
              </div>
              <Replay ops={a.ops} />
            </article>
          );
        })}
      </section>
    </div>
  );
}
