import { describe, it, expect, vi, afterEach } from 'vitest';
import { serverSigner, serverThenLocal, localDemoSigner } from '../src/exam/signerApi';
import { verifyCertificate } from '@pie/integrity-core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('serverSigner', () => {
  it('POSTs the root + tenant and returns the server certificate', async () => {
    const fakeCert = { root: 'abc', alg: 'HMAC-SHA256', signedAt: 1, signature: 'deadbeef' };
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(fakeCert), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const cert = await serverSigner('http://srv/', 'demo')('abc');
    expect(cert).toEqual(fakeCert);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://srv/v1/certificates/sign',
      expect.objectContaining({ method: 'POST' }),
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ tenant: 'demo', root: 'abc' });
  });
});

describe('serverThenLocal', () => {
  it('falls back to a valid local signature when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const cert = await serverThenLocal('http://srv', 'demo')('root-1');
    expect(cert.root).toBe('root-1');
    expect(verifyCertificate(cert, 'pie-demo-tenant-secret')).toBe(true);
  });
});

describe('localDemoSigner', () => {
  it('produces a certificate that verifies with the demo secret', async () => {
    const cert = await localDemoSigner('xyz');
    expect(verifyCertificate(cert, 'pie-demo-tenant-secret')).toBe(true);
  });
});
