import { useMemo, useState } from 'react';
import {
  verifySignedBundle,
  parseCertificatePackage,
  authorshipVerdict,
  analyzeIntegrity,
  type AnswerSummary,
  type AuthenticityBundle,
  type IntegrityFlag,
  type SignedCertificate,
} from '@pie/integrity-core';
import { Replay } from './Replay';
import { demoPackage } from './demoPackage';

interface LoadedPackage {
  bundle: AuthenticityBundle;
  cert: SignedCertificate;
}

function ImportPanel({
  onLoad,
  secret,
  setSecret,
}: {
  onLoad: (pkg: LoadedPackage) => void;
  secret: string;
  setSecret: (s: string) => void;
}) {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  // The tenant secret is applied live (see ReviewConsole), so loading only needs
  // the bundle + cert. Empty input is ignored rather than reported as an error.
  const loadFromText = (text: string) => {
    if (!text.trim()) {
      setError(null);
      return;
    }
    try {
      const { bundle, cert } = parseCertificatePackage(text);
      onLoad({ bundle, cert });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load package');
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadFromText(String(reader.result ?? ''));
    reader.onerror = () => setError('Could not read file');
    reader.readAsText(file);
  };

  return (
    <details className="import">
      <summary>Load a certificate package</summary>
      <p className="import-hint">
        Load the downloaded <code>pie-certificate-*.json</code> file (recommended), or paste it below.
        The tenant secret applies as you type.
      </p>
      <input
        type="file"
        accept="application/json,.json"
        aria-label="Certificate file"
        onChange={onFile}
      />
      <textarea
        aria-label="Certificate package JSON"
        placeholder="…or paste the certificate JSON here"
        rows={4}
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <input
        aria-label="Tenant secret"
        placeholder="Tenant secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <button onClick={() => loadFromText(json)}>Verify pasted package</button>
      {error && <p className="warn import-error">{error}</p>}
    </details>
  );
}

const SEVERITY_CLASS: Record<string, string> = { high: 'warn', medium: 'amber', low: 'muted' };

function FlagsPanel({ flags }: { flags: IntegrityFlag[] }) {
  return (
    <section className="flags" aria-label="Integrity flags">
      <h2>Integrity flags</h2>
      {flags.length === 0 ? (
        <p className="ok">No flags raised — clean session.</p>
      ) : (
        <ul>
          {flags.map((f, i) => (
            <li key={`${f.code}-${i}`} className={SEVERITY_CLASS[f.severity] ?? 'muted'}>
              <strong>[{f.severity}]</strong> {f.detail}
            </li>
          ))}
        </ul>
      )}
      <p className="cert-note">Flags are evidence for human review, never an automatic accusation.</p>
    </section>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className={ok ? 'ok' : 'warn'}>
      {ok ? '✓' : '✗'} {label}
    </li>
  );
}

function AnswerCard({ answer }: { answer: AnswerSummary }) {
  if (answer.kind === 'choice') {
    const value = answer.choice?.value ?? '(no answer)';
    const secs = ((answer.choice?.latencyMs ?? 0) / 1000).toFixed(1);
    const changes = answer.choice?.changes ?? 0;
    return (
      <article className="answer">
        <div className="answer-head">
          <strong>{answer.id}</strong>
          <span>choice · selected “{value}”</span>
          <span className="ok">
            answered in {secs}s{changes > 0 ? ` · ${changes} change${changes === 1 ? '' : 's'}` : ''}
          </span>
        </div>
      </article>
    );
  }
  const verdict = authorshipVerdict(answer.metrics);
  return (
    <article className="answer">
      <div className="answer-head">
        <strong>{answer.id}</strong>
        <span>
          typed {answer.metrics.typedChars} · pasted {answer.metrics.pastedChars} ·{' '}
          {(answer.metrics.pasteRatio * 100).toFixed(0)}% paste
        </span>
        <span className={verdict.level === 'ok' ? 'ok' : 'warn'}>{verdict.label}</span>
      </div>
      <Replay ops={answer.ops} />
    </article>
  );
}

export function ReviewConsole({ pkg = demoPackage }: { pkg?: { bundle: AuthenticityBundle; cert: SignedCertificate; secret: string } }) {
  const [loaded, setLoaded] = useState<LoadedPackage>({ bundle: pkg.bundle, cert: pkg.cert });
  const [secret, setSecret] = useState(pkg.secret);

  const result = useMemo(
    () => verifySignedBundle({ bundle: loaded.bundle, cert: loaded.cert, secret }),
    [loaded, secret],
  );
  const flags = useMemo(
    () => analyzeIntegrity({ events: loaded.bundle.events, answers: loaded.bundle.answers }),
    [loaded],
  );

  return (
    <div className="review">
      <header className="review-header">
        <h1>PIE Review Console</h1>
        <span className="badge">Verify · Replay</span>
      </header>

      <ImportPanel onLoad={setLoaded} secret={secret} setSecret={setSecret} />

      <section className={`verdict ${result.ok ? 'ok-box' : 'warn-box'}`} aria-label="Verification result">
        <h2>{result.ok ? 'Certificate verified' : 'Certificate FAILED verification'}</h2>
        <ul className="checks">
          <Check label="Hash chain intact (no event tampered)" ok={result.chainOk} />
          <Check label="Signed root matches chain root" ok={result.rootMatches} />
          <Check label="Signature valid under tenant secret" ok={result.signatureOk} />
        </ul>
        <p className="chain-root">
          root <code>{loaded.bundle.root.slice(0, 28)}…</code> · {loaded.bundle.events.length} events
        </p>
        <button
          className="tamper"
          onClick={() =>
            setLoaded((p) => {
              const events = p.bundle.events.map((e) => ({ ...e }));
              if (events[0]) (events[0] as { data: Record<string, unknown> }).data = { hacked: true };
              return { ...p, bundle: { ...p.bundle, events } };
            })
          }
        >
          Simulate tampering
        </button>
      </section>

      <FlagsPanel flags={flags} />

      <section className="answers" aria-label="Answers">
        <h2>Answers</h2>
        {loaded.bundle.answers.map((a) => (
          <AnswerCard key={a.id} answer={a} />
        ))}
      </section>
    </div>
  );
}
