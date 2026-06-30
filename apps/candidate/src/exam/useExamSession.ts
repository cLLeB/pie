import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthenticityBundle, InputEventLike, SignedCertificate } from '@pie/integrity-core';
import { ExamSession, type IntegritySummary } from './session';
import { localDemoSigner, type RootSigner } from './signerApi';
import type { Exam } from './types';

export interface UseExamSession {
  summary: IntegritySummary;
  bundle: AuthenticityBundle | null;
  signedCert: SignedCertificate | null;
  recordTextInput: (questionId: string, e: InputEventLike) => void;
  recordChoice: (questionId: string, value: string) => void;
  recordFaceCount: (count: number) => void;
  textAnswer: (questionId: string) => string;
  submit: () => void;
}

/**
 * React binding over the framework-agnostic ExamSession. Wires browser focus/
 * visibility into the integrity ledger and exposes a live summary for the
 * glass-box panel. All integrity logic lives in ExamSession; this hook only
 * adapts DOM events and React state.
 */
export function useExamSession(exam: Exam, signer: RootSigner = localDemoSigner): UseExamSession {
  const sessionRef = useRef<ExamSession | null>(null);
  if (sessionRef.current === null) {
    sessionRef.current = new ExamSession(exam);
    sessionRef.current.start();
  }
  const session = sessionRef.current;

  const [summary, setSummary] = useState<IntegritySummary>(() => session.integritySummary());
  const [bundle, setBundle] = useState<AuthenticityBundle | null>(null);
  const [signedCert, setSignedCert] = useState<SignedCertificate | null>(null);
  const refresh = useCallback(() => setSummary(session.integritySummary()), [session]);

  useEffect(() => {
    const onBlur = () => {
      session.focusLost();
      refresh();
    };
    const onFocus = () => {
      session.focusGained();
      refresh();
    };
    const onVisibility = () => {
      session.logEvent(document.hidden ? 'visibility.hidden' : 'visibility.visible');
      refresh();
    };
    const onFullscreen = () => {
      session.logEvent(document.fullscreenElement ? 'fullscreen.entered' : 'fullscreen.exited');
      refresh();
    };
    const onClipboard = (type: string) => (e: ClipboardEvent) => {
      const length = (e.clipboardData?.getData('text') ?? '').length;
      session.logEvent(type, { length });
      refresh();
    };
    const onCopy = onClipboard('clipboard.copy');
    const onCut = onClipboard('clipboard.cut');
    const onPaste = onClipboard('clipboard.paste');

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    };
  }, [session, refresh]);

  const recordTextInput = useCallback(
    (questionId: string, e: InputEventLike) => {
      session.recordInput(questionId, e);
      refresh();
    },
    [session, refresh],
  );

  const recordChoice = useCallback(
    (questionId: string, value: string) => {
      session.recordChoice(questionId, value);
      refresh();
    },
    [session, refresh],
  );

  const recordFaceCount = useCallback(
    (count: number) => {
      session.observeFaceCount(count);
      refresh();
    },
    [session, refresh],
  );

  const textAnswer = useCallback((questionId: string) => session.answerText(questionId), [session]);

  const submit = useCallback(() => {
    const finalized = session.finalize();
    setBundle(finalized);
    refresh();
    void signer(finalized.root).then(setSignedCert);
  }, [session, refresh, signer]);

  return {
    summary,
    bundle,
    signedCert,
    recordTextInput,
    recordChoice,
    recordFaceCount,
    textAnswer,
    submit,
  };
}
