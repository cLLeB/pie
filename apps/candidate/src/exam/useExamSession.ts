import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthenticityBundle } from '@pie/integrity-core';
import { ExamSession, type IntegritySummary } from './session';
import type { Exam } from './types';

export interface UseExamSession {
  summary: IntegritySummary;
  bundle: AuthenticityBundle | null;
  recordTextInput: (questionId: string, e: React.FormEvent<HTMLTextAreaElement>) => void;
  recordChoice: (questionId: string, value: string) => void;
  textAnswer: (questionId: string) => string;
  submit: () => void;
}

/**
 * React binding over the framework-agnostic ExamSession. Wires browser focus/
 * visibility into the integrity ledger and exposes a live summary for the
 * glass-box panel. All integrity logic lives in ExamSession; this hook only
 * adapts DOM events and React state.
 */
export function useExamSession(exam: Exam): UseExamSession {
  const sessionRef = useRef<ExamSession | null>(null);
  if (sessionRef.current === null) {
    sessionRef.current = new ExamSession(exam);
    sessionRef.current.start();
  }
  const session = sessionRef.current;

  const [summary, setSummary] = useState<IntegritySummary>(() => session.integritySummary());
  const [bundle, setBundle] = useState<AuthenticityBundle | null>(null);
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
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [session, refresh]);

  const recordTextInput = useCallback(
    (questionId: string, e: React.FormEvent<HTMLTextAreaElement>) => {
      const native = e.nativeEvent as InputEvent;
      const target = e.currentTarget;
      session.recordInput(questionId, {
        inputType: native.inputType,
        data: native.data,
        // Bound to onBeforeInput: selectionStart is the pre-edit caret, i.e. the
        // position where this edit applies — exactly what the recorder expects.
        selectionStart: target.selectionStart ?? target.value.length,
      });
      refresh();
    },
    [session, refresh],
  );

  const recordChoice = useCallback(
    (questionId: string, value: string) => {
      session.logEvent('answer.choice', { questionId, value });
      refresh();
    },
    [session, refresh],
  );

  const textAnswer = useCallback((questionId: string) => session.answerText(questionId), [session]);

  const submit = useCallback(() => {
    setBundle(session.finalize());
    refresh();
  }, [session, refresh]);

  return { summary, bundle, recordTextInput, recordChoice, textAnswer, submit };
}
