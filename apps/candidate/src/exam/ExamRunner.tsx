import { useState } from 'react';
import { useExamSession } from './useExamSession';
import { GlassBox } from './GlassBox';
import { Certificate } from './Certificate';
import type { RootSigner } from './signerApi';
import type { Exam } from './types';

export function ExamRunner({ exam, signer }: { exam: Exam; signer?: RootSigner }) {
  const { summary, bundle, signedCert, recordTextInput, recordChoice, submit } = useExamSession(
    exam,
    signer,
  );
  const [choices, setChoices] = useState<Record<string, string>>({});

  const onChoice = (questionId: string, value: string) => {
    setChoices((c) => ({ ...c, [questionId]: value }));
    recordChoice(questionId, value);
  };

  return (
    <div className="exam">
      <header className="exam-header">
        <h1>{exam.title}</h1>
        <span className="badge">PIE · Proof-of-Authorship</span>
      </header>

      <div className="exam-body">
        <main className="questions">
          {exam.questions.map((q, i) => (
            <fieldset key={q.id} className="question">
              <legend>
                Q{i + 1}. {q.prompt}
              </legend>
              {q.kind === 'text' ? (
                <textarea
                  aria-label={`Answer to ${q.id}`}
                  rows={5}
                  placeholder="Type your answer…"
                  onBeforeInput={(e) => recordTextInput(q.id, e)}
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

        <GlassBox summary={summary} />
      </div>
    </div>
  );
}
