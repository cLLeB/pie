import type { Exam } from './types';

/** Fetch an exam definition from the PIE server. */
export async function fetchExam(baseUrl: string, id: string): Promise<Exam> {
  const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/exams/${encodeURIComponent(id)}`);
  if (!resp.ok) throw new Error(`exam load failed: ${resp.status}`);
  return (await resp.json()) as Exam;
}
