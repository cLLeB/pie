"""Stores for events and issued certificates.

Two interchangeable implementations behind one Protocol:
- `Store`        — in-memory (tests, ephemeral dev).
- `SqliteStore`  — durable single-file persistence (stdlib sqlite3, no server),
                   ideal for on-prem / air-gapped deployments.

A Postgres/object-store implementation can be added behind the same `EventStore`
Protocol without touching the API layer.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any, Protocol


class EventStore(Protocol):
    def append_events(self, session_id: str, events: list[dict[str, Any]]) -> int: ...
    def events_for(self, session_id: str) -> list[dict[str, Any]]: ...
    def save_certificate(self, cert: dict[str, Any]) -> None: ...
    def certificate(self, root: str) -> dict[str, Any] | None: ...


class Store:
    """In-memory store."""

    def __init__(self) -> None:
        self._events: dict[str, list[dict[str, Any]]] = {}
        self._certificates: dict[str, dict[str, Any]] = {}

    def append_events(self, session_id: str, events: list[dict[str, Any]]) -> int:
        self._events.setdefault(session_id, []).extend(events)
        return len(events)

    def events_for(self, session_id: str) -> list[dict[str, Any]]:
        return list(self._events.get(session_id, []))

    def save_certificate(self, cert: dict[str, Any]) -> None:
        self._certificates[cert["root"]] = cert

    def certificate(self, root: str) -> dict[str, Any] | None:
        return self._certificates.get(root)


class SqliteStore:
    """Durable single-file store. `path=":memory:"` for an ephemeral in-process DB."""

    def __init__(self, path: str = ":memory:") -> None:
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute("CREATE TABLE IF NOT EXISTS events (session_id TEXT, payload TEXT)")
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS certificates (root TEXT PRIMARY KEY, payload TEXT)"
        )
        self._conn.commit()

    def append_events(self, session_id: str, events: list[dict[str, Any]]) -> int:
        self._conn.executemany(
            "INSERT INTO events (session_id, payload) VALUES (?, ?)",
            [(session_id, json.dumps(e)) for e in events],
        )
        self._conn.commit()
        return len(events)

    def events_for(self, session_id: str) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT payload FROM events WHERE session_id = ? ORDER BY rowid", (session_id,)
        ).fetchall()
        return [json.loads(r[0]) for r in rows]

    def save_certificate(self, cert: dict[str, Any]) -> None:
        self._conn.execute(
            "INSERT OR REPLACE INTO certificates (root, payload) VALUES (?, ?)",
            (cert["root"], json.dumps(cert)),
        )
        self._conn.commit()

    def certificate(self, root: str) -> dict[str, Any] | None:
        row = self._conn.execute(
            "SELECT payload FROM certificates WHERE root = ?", (root,)
        ).fetchone()
        return json.loads(row[0]) if row else None
