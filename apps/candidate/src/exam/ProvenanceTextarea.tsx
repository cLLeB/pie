import { useEffect, useRef } from 'react';
import type { InputEventLike } from '@pie/integrity-core';

/**
 * A textarea that captures keystroke-level provenance from the NATIVE `beforeinput`
 * event. React's synthetic `onBeforeInput` exposes `data` but not `inputType`, so it
 * cannot distinguish typing from pasting — the whole point of provenance. Binding the
 * native InputEvent via a ref gives us reliable `inputType` + `data` + the pre-edit
 * caret position.
 */
export function ProvenanceTextarea({
  record,
  ariaLabel,
}: {
  record: (e: InputEventLike) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const recordRef = useRef(record);
  recordRef.current = record;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (ev: Event) => {
      const ie = ev as InputEvent;
      recordRef.current({
        inputType: ie.inputType,
        data: ie.data,
        // At beforeinput time the DOM has not mutated yet, so selectionStart is the
        // pre-edit caret — exactly the position this edit applies at.
        selectionStart: el.selectionStart ?? el.value.length,
      });
    };
    el.addEventListener('beforeinput', handler);
    return () => el.removeEventListener('beforeinput', handler);
  }, []);

  return <textarea ref={ref} aria-label={ariaLabel} rows={5} placeholder="Type your answer…" />;
}
