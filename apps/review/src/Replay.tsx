import { useState } from 'react';
import { textAtStep, type EditOp } from '@pie/integrity-core';

/**
 * Authorship replay: a scrubber over an answer's provenance. Dragging it shows the
 * answer coming into being keystroke by keystroke — a human answer grows with edits;
 * a pasted one appears whole in a single step. Reconstructed from KB of ops, no video.
 */
export function Replay({ ops }: { ops: EditOp[] }) {
  const [step, setStep] = useState(ops.length);
  const text = textAtStep(ops, step);

  if (ops.length === 0) {
    return <p className="replay-empty">No typed provenance for this answer.</p>;
  }

  return (
    <div className="replay">
      <input
        type="range"
        min={0}
        max={ops.length}
        value={step}
        aria-label="Replay position"
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <span className="replay-pos">
        step {step}/{ops.length}
      </span>
      <pre className="replay-text" aria-label="Reconstructed answer">
        {text}
        <span className="caret">▏</span>
      </pre>
    </div>
  );
}
