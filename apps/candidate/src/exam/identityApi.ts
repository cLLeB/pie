export interface IdentityResult {
  match: boolean;
  score: number;
}

/**
 * Ask the PIE server to confirm the captured frame is the enrolled candidate.
 * The server proxies the biometric `/v1` engine, so the biometric API key never
 * reaches the browser. Returns match + confidence; callers record it into the ledger.
 */
export async function verifyIdentity(
  baseUrl: string,
  tenant: string,
  userId: string,
  image: string,
): Promise<IdentityResult> {
  const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/identity/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tenant, user_id: userId, image }),
  });
  if (!resp.ok) throw new Error(`identity verify failed: ${resp.status}`);
  const data = (await resp.json()) as { match?: boolean; score?: number };
  return { match: Boolean(data.match), score: Number(data.score ?? 0) };
}
