import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProvenanceTextarea } from '../src/exam/ProvenanceTextarea';

function fireBeforeInput(el: HTMLElement, inputType: string, data: string | null) {
  // Construct a native InputEvent so inputType/data are present (the exact fields
  // React's synthetic onBeforeInput dropped, which was the bug).
  const ev = new InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
}

describe('ProvenanceTextarea', () => {
  it('captures inputType and data from the native beforeinput event', () => {
    const record = vi.fn();
    render(<ProvenanceTextarea record={record} ariaLabel="answer" />);
    const ta = screen.getByLabelText('answer');

    fireBeforeInput(ta, 'insertText', 'h');
    fireBeforeInput(ta, 'insertFromPaste', 'pasted text');

    expect(record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ inputType: 'insertText', data: 'h' }),
    );
    expect(record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ inputType: 'insertFromPaste', data: 'pasted text' }),
    );
  });
});
