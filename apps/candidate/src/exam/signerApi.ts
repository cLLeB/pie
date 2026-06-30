import { signCertificate, type SignedCertificate } from '@pie/integrity-core';

/** Signs a chain root, returning a verifiable certificate. */
export type RootSigner = (root: string) => Promise<SignedCertificate>;

// Demo fallback: signs in-browser with a demo secret so the app works offline /
// without a server. In production the server holds the real tenant secret.
const DEMO_SIGNING_SECRET = 'pie-demo-tenant-secret';

export const localDemoSigner: RootSigner = async (root) =>
  signCertificate({ root }, DEMO_SIGNING_SECRET);

/** Real path: ask the server to sign with the tenant's secret. */
export function serverSigner(baseUrl: string, tenant: string): RootSigner {
  return async (root) => {
    const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/certificates/sign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenant, root }),
    });
    if (!resp.ok) throw new Error(`sign failed: ${resp.status}`);
    return (await resp.json()) as SignedCertificate;
  };
}

/** Prefer the server; fall back to the local demo signer if it is unreachable. */
export function serverThenLocal(baseUrl: string, tenant: string): RootSigner {
  const server = serverSigner(baseUrl, tenant);
  return async (root) => {
    try {
      return await server(root);
    } catch {
      return localDemoSigner(root);
    }
  };
}
