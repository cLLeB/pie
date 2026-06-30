"""Cross-language-compatible signing and chain verification.

Mirrors `@pie/integrity-core`:
- canonicalize: JSON with recursively sorted keys and no whitespace
  (matches JS `JSON.stringify` over a key-sorted value).
- sha256_hex / hmac_hex: standard hex digests.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

ALG = "HMAC-SHA256"
GENESIS = "GENESIS"


def canonicalize(value: Any) -> str:
    """Deterministic JSON: keys sorted recursively, compact separators.

    `sort_keys=True` sorts every nested object's keys; arrays keep their order.
    `separators=(",", ":")` matches JS JSON.stringify (no spaces). `ensure_ascii=
    False` leaves non-ASCII as-is, like JSON.stringify.
    """
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hmac_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def sign_certificate(root: str, secret: str, signed_at: int) -> dict[str, Any]:
    """Sign a chain root, binding the signing time into the signature."""
    signature = hmac_hex(secret, canonicalize({"root": root, "alg": ALG, "signedAt": signed_at}))
    return {"root": root, "alg": ALG, "signedAt": signed_at, "signature": signature}


def verify_certificate(cert: dict[str, Any], secret: str) -> bool:
    expected = hmac_hex(
        secret,
        canonicalize({"root": cert["root"], "alg": cert["alg"], "signedAt": cert["signedAt"]}),
    )
    return hmac.compare_digest(expected, str(cert.get("signature", "")))


def _hash_event(e: dict[str, Any]) -> str:
    return sha256_hex(
        canonicalize(
            {
                "seq": e["seq"],
                "ts": e["ts"],
                "type": e["type"],
                "data": e["data"],
                "prevHash": e["prevHash"],
            }
        )
    )


def verify_chain(events: list[dict[str, Any]], genesis: str = GENESIS) -> bool:
    """Recompute the hash chain and confirm every hash and link is intact."""
    for i, e in enumerate(events):
        expected_prev = genesis if i == 0 else events[i - 1]["hash"]
        if e["prevHash"] != expected_prev:
            return False
        if e["hash"] != _hash_event(e):
            return False
    return True
