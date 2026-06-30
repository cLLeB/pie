# @pie/server (FastAPI)

Event ingestion, **server-side certificate signing**, verification, and a certificate
registry. Signing is **byte-compatible with `@pie/integrity-core`** (TypeScript): a
certificate signed here verifies in the browser review console, and one produced in
the browser verifies here. A pinned cross-language signature locks the two signers
together (`tests/test_signing.py` ↔ `packages/integrity-core/tests/signing.test.ts`).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthz` | readiness |
| POST | `/v1/events` | ingest a batch of integrity events for a session |
| POST | `/v1/certificates/sign` | sign a chain root with the tenant's secret; store in registry |
| POST | `/v1/certificates/verify` | verify chain + root match + signature |
| GET | `/v1/certificates/{root}` | registry lookup (independent verification) |

Tenant secrets come from `PIE_TENANT_SECRETS` (JSON, e.g. `{"acme":"…"}`); a `demo`
tenant is provided when unset. The store is in-memory now (swappable for Postgres +
object store behind the same interface).

## Develop

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # (Scripts on Windows, bin on *nix)
.venv/Scripts/python -m pytest                            # 11 tests
.venv/Scripts/python -m uvicorn pie_server.app:app --reload
```

## Why server-side signing

The browser demo signs with a demo secret to render a real signature, but in
production the tenant secret must never reach the client. The candidate app submits
the bundle root here; the server signs and registers it. The same HMAC pattern the
biometric engine already uses to sign verify results — which is the next integration:
this server fronts the biometric `/v1` API as PIE's identity layer.
