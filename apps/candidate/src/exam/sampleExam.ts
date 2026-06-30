import type { Exam } from './types';

export const sampleExam: Exam = {
  id: 'pie-demo-001',
  title: 'PIE Demo Exam — Proof-of-Authorship',
  durationSeconds: 1800,
  questions: [
    {
      id: 'q1',
      prompt:
        'In your own words, explain why detecting AI-written text after the fact is unreliable, and how provenance changes the problem. (Type your answer — try pasting to see the difference.)',
      kind: 'text',
    },
    {
      id: 'q2',
      prompt: 'Which signal most reliably indicates a candidate left the exam surface?',
      kind: 'choice',
      options: ['Mouse velocity', 'Page Visibility / window blur', 'CPU temperature', 'Battery level'],
    },
    {
      id: 'q3',
      prompt: 'Briefly: what does the Authenticity Certificate bind together?',
      kind: 'text',
    },
  ],
};
