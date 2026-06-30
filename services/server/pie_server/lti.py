"""LTI 1.3 Resource Link launch validation.

The security-critical step of an LTI launch is verifying the platform-signed
`id_token` (a JWT) — signature (RS256 against the platform's public key), audience
(our client_id), issuer (the platform), and expiry. We then extract the standard
LTI claims. The full OIDC login-initiation handshake wraps this; this module is the
trust core, kept pure so it is tested directly with a generated key pair.
"""

from __future__ import annotations

from typing import Any

import jwt

CLAIM_BASE = "https://purl.imsglobal.org/spec/lti/claim"
MESSAGE_TYPE_CLAIM = f"{CLAIM_BASE}/message_type"
ROLES_CLAIM = f"{CLAIM_BASE}/roles"
RESOURCE_LINK_CLAIM = f"{CLAIM_BASE}/resource_link"
CONTEXT_CLAIM = f"{CLAIM_BASE}/context"
RESOURCE_LINK_REQUEST = "LtiResourceLinkRequest"


class LtiError(Exception):
    """Raised when an LTI launch token is invalid or not a resource-link request."""


def validate_launch(id_token: str, public_key: str, audience: str, issuer: str) -> dict[str, Any]:
    """Verify a platform id_token and return the normalized launch claims."""
    try:
        claims = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
        )
    except jwt.PyJWTError as exc:
        raise LtiError(f"invalid id_token: {exc}") from exc

    if claims.get(MESSAGE_TYPE_CLAIM) != RESOURCE_LINK_REQUEST:
        raise LtiError("not an LtiResourceLinkRequest")

    return {
        "sub": claims.get("sub"),
        "name": claims.get("name"),
        "email": claims.get("email"),
        "roles": claims.get(ROLES_CLAIM, []),
        "resource_link": claims.get(RESOURCE_LINK_CLAIM, {}),
        "context": claims.get(CONTEXT_CLAIM, {}),
    }
