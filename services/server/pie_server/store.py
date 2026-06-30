"""In-memory store for events and issued certificates.

Deliberately a simple, swappable interface — a Postgres/object-store implementation
slots in behind the same methods later without touching the API layer.
"""

from __future__ import annotations

from typing import Any


class Store:
    def __init__(self) -> None:
        self._events: dict[str, list[dict[str, Any]]] = {}
        self._certificates: dict[str, dict[str, Any]] = {}

    def append_events(self, session_id: str, events: list[dict[str, Any]]) -> int:
        bucket = self._events.setdefault(session_id, [])
        bucket.extend(events)
        return len(events)

    def events_for(self, session_id: str) -> list[dict[str, Any]]:
        return list(self._events.get(session_id, []))

    def save_certificate(self, cert: dict[str, Any]) -> None:
        self._certificates[cert["root"]] = cert

    def certificate(self, root: str) -> dict[str, Any] | None:
        return self._certificates.get(root)
