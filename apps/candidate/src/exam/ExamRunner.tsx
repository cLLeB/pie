import { useState } from 'react';
import { useExamSession } from './useExamSession';
import { GlassBox } from './GlassBox';
import { Certificate } from './Certificate';
import { ProvenanceTextarea } from './ProvenanceTextarea';
import { WebcamMonitor } from './WebcamMonitor';
import { Timer } from './Timer';
import { useCountdown } from './useCountdown';
import type { RootSigner } from './signerApi';
import type { IdentityResult } from './identityApi';
import type { Exam } from './types';

export function ExamRunner({
  exam,
  signer,
  identityVerify,
}: {
  exam: Exam;
  signer?: RootSigner;
  identityVerify?: (image: string) => Promise<IdentityResult>;
}) {
  const {
    summary,
    bundle,
    signedCert,
    recordTextInput,
    recordChoice,
    recordFaceCount,
    recordGaze,
    recordIdentityCheck,
    submit,
  } = useExamSession(exam, signer);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [cameraOn, setCameraOn] = useState(false);

  const submitted = bundle !== null;
  const remaining = useCountdown(exam.durationSeconds, () => {
    if (!submitted) submit();
  });

  const onChoice = (questionId: string, value: string) => {
    setChoices((c) => ({ ...c, [questionId]: value }));
    recordChoice(questionId, value);
  };

  return (
    <div className="exam">
      <header className="exam-header">
        <h1>{exam.title}</h1>
        <div className="exam-header-right">
          {!submitted && <Timer remaining={remaining} />}
          <span className="badge">PIE · Proof-of-Authorship</span>
        </div>
      </header>

      <div className="exam-body">
        <main className="questions">
          {exam.questions.map((q, i) => (
            <fieldset key={q.id} className="question">
              <legend>
                Q{i + 1}. {q.prompt}
              </legend>
              {q.kind === 'text' ? (
                <ProvenanceTextarea
                  ariaLabel={`Answer to ${q.id}`}
                  record={(e) => recordTextInput(q.id, e)}
                />
              ) : (
                <div className="choices">
                  {(q.options ?? []).map((opt) => (
                    <label key={opt} className="choice">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={choices[q.id] === opt}
                        onChange={() => onChoice(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}

          {bundle === null ? (
            <button className="submit" onClick={submit}>
              Submit exam
            </button>
          ) : (
            <Certificate bundle={bundle} signedCert={signedCert} />
          )}
        </main>

        <div className="side">
          <GlassBox summary={summary} />
          {cameraOn ? (
            <WebcamMonitor
              onFaceCount={recordFaceCount}
              onGaze={recordGaze}
              onIdentityFrame={
                identityVerify
                  ? (image) => {
                      void identityVerify(image)
                        .then((r) => recordIdentityCheck(r.match, r.score))
                        .catch(() => {
                          /* identity backend unavailable — skip this check */
                        });
                    }
                  : undefined
              }
            />
          ) : (
            <button className="camera-toggle" onClick={() => setCameraOn(true)}>
              Enable camera presence check
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
