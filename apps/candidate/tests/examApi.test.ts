import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchExam } from '../src/exam/examApi';

afterEach(() => vi.restoreAllMocks());

describe('fetchExam', () => {
  it('GETs the exam by id and returns it', async () => {
    const exam = { id: 'x1', title: 'X', durationSeconds: 60, questions: [] };
    const fetchMock = vi.fn((_url: string) =>
      Promise.resolve(new Response(JSON.stringify(exam), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const got = await fetchExam('http://srv/', 'x1');
    expect(got).toEqual(exam);
    expect(fetchMock).toHaveBeenCalledWith('http://srv/v1/exams/x1');
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string) => Promise.resolve(new Response('', { status: 404 }))));
    await expect(fetchExam('http://srv', 'missing')).rejects.toThrow(/exam load failed: 404/);
  });
});
