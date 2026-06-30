"""Identity layer — fronts the existing contactless face/palm `/v1` verification
service as PIE's "WHO". The server proxies continuous-identity checks so the
tenant's biometric API key never reaches the browser.

The client is an injectable protocol so the API layer is tested with a fake and
the HTTP implementation is tested with an httpx MockTransport — no live service.
"""

from __future__ import annotations

from typing import Any, Protocol

import httpx


class IdentityClient(Protocol):
    def verify(self, tenant: str, user_id: str, image: str) -> dict[str, Any]:
        """1:1 check that `image` is `user_id`. Returns at least {success, score}."""
        ...


class HttpIdentityClient:
    """Talks to the biometric service's `POST /v1/verify` (X-API-Key auth)."""

    def __init__(self, base_url: str, api_key: str, client: httpx.Client | None = None) -> None:
        self._base = base_url.rstrip("/")
        self._key = api_key
        self._client = client or httpx.Client(timeout=10.0)

    def verify(self, tenant: str, user_id: str, image: str) -> dict[str, Any]:
        resp = self._client.post(
            f"{self._base}/v1/verify",
            headers={"X-API-Key": self._key},
            json={"user_id": user_id, "image": image, "tenant": tenant},
        )
        resp.raise_for_status()
        return resp.json()
