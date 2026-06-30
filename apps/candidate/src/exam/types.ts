export interface Question {
  id: string;
  prompt: string;
  /** 'text' = free-typed answer (provenance-rich); 'choice' = single-select. */
  kind: 'text' | 'choice';
  /** Options for 'choice' questions. */
  options?: string[];
}

export interface Exam {
  id: string;
  title: string;
  /** Duration in seconds; the runner counts down from here. */
  durationSeconds: number;
  questions: Question[];
}
