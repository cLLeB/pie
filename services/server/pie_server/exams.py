"""Exam delivery. An in-memory repository of exam definitions (the shape the
candidate app consumes). Swap for a DB-backed repo + QTI import later behind the
same `get` interface."""

from __future__ import annotations

from typing import Any

_DEMO_EXAM: dict[str, Any] = {
    "id": "pie-demo-001",
    "title": "PIE Demo Exam — Proof-of-Authorship",
    "durationSeconds": 1800,
    "questions": [
        {
            "id": "q1",
            "prompt": "Explain why provenance beats after-the-fact AI-text detection.",
            "kind": "text",
        },
        {
            "id": "q2",
            "prompt": "Which signal most reliably indicates a candidate left the exam surface?",
            "kind": "choice",
            "options": ["Mouse velocity", "Page Visibility / window blur", "CPU temperature", "Battery level"],
        },
        {"id": "q3", "prompt": "What does the Authenticity Certificate bind together?", "kind": "text"},
    ],
}


class ExamRepo:
    def __init__(self, exams: dict[str, dict[str, Any]] | None = None) -> None:
        self._exams = exams or {_DEMO_EXAM["id"]: _DEMO_EXAM}

    def get(self, exam_id: str) -> dict[str, Any] | None:
        return self._exams.get(exam_id)
