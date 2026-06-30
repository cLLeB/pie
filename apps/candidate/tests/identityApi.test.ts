import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyIdentity } from '../src/exam/identityApi';

afterEach(() => vi.restoreAllMocks());

describe('verifyIdentity', () => {
  it('POSTs tenant/user/image and normalizes the result', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ match: true, score: 0.93 }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyIdentity('http://srv/', 'demo', 'alice', 'data:image/jpeg;base64,xx');
    expect(result).toEqual({ match: true, score: 0.93 });

    const [url, init] = [fetchMock.mock.calls[0]?.[0], fetchMock.mock.calls[0]?.[1] as RequestInit];
    expect(url).toBe('http://srv/v1/identity/verify');
    expect(JSON.parse(init.body as string)).toEqual({
      tenant: 'demo',
      user_id: 'alice',
      image: 'data:image/jpeg;base64,xx',
    });
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 503 }))));
    await expect(verifyIdentity('http://srv', 'demo', 'alice', 'img')).rejects.toThrow(/503/);
  });
});
