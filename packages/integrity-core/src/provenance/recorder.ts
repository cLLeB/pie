import type { EditOp } from './ops.js';

/**
 * The minimal shape of a DOM `InputEvent` we consume. In production an input/
 * textarea's `beforeinput`/`input` listener forwards `{ inputType, data,
 * selectionStart }`; tests feed synthetic objects. Keeping the surface tiny keeps
 * the recorder framework-agnostic.
 */
export interface InputEventLike {
  inputType: string;
  data: string | null;
  /** Caret position associated with the edit. */
  selectionStart: number;
}

/**
 * Bridges raw input events into the `EditOp[]` provenance stream that powers the
 * authorship metrics, replay, and ultimately the Authenticity Certificate. It is
 * deliberately conservative: unknown input types are ignored rather than guessed.
 */
export class ProvenanceRecorder {
  private readonly log: EditOp[] = [];

  constructor(private readonly now: () => number = Date.now) {}

  onInput(e: InputEventLike): void {
    const t = this.now();
    switch (e.inputType) {
      case 'insertText':
        if (e.data) this.log.push({ t, kind: 'insert', pos: e.selectionStart, text: e.data });
        break;
      case 'insertFromPaste':
        if (e.data) this.log.push({ t, kind: 'paste', pos: e.selectionStart, text: e.data });
        break;
      case 'deleteContentBackward':
        this.log.push({ t, kind: 'delete', pos: Math.max(0, e.selectionStart - 1), len: 1 });
        break;
      default:
        // Unrecognized input type — ignore rather than fabricate provenance.
        break;
    }
  }

  /** A copy of the recorded provenance stream. */
  ops(): EditOp[] {
    return this.log.map((op) => ({ ...op }));
  }
}
