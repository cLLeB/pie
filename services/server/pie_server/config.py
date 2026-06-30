"""Configuration. Tenant secrets are read from the environment so they never live
in source. A demo secret is provided when unset so local dev works out of the box."""

from __future__ import annotations

import json
import os

DEMO_TENANT = "demo"
DEMO_SECRET = "pie-demo-tenant-secret"


def tenant_secrets() -> dict[str, str]:
    raw = os.environ.get("PIE_TENANT_SECRETS")
    if raw:
        return json.loads(raw)
    return {DEMO_TENANT: DEMO_SECRET}


def secret_for(tenant: str) -> str | None:
    return tenant_secrets().get(tenant)
