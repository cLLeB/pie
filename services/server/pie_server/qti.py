"""Minimal QTI 3.0 import: turn an assessment's item XML into PIE's exam shape.

Supports the two interactions PIE renders today — `qti-choice-interaction`
(objective) and `qti-extended-text-interaction` (free text). Namespaces are handled
by matching on the local tag name, so namespaced and un-namespaced QTI both parse.
A fuller QTI surface can be added behind this same function.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _text(el: ET.Element) -> str:
    return "".join(el.itertext()).strip()


def _prompt_for(item: ET.Element) -> str:
    # Prefer an explicit qti-prompt; otherwise the first non-empty paragraph.
    for el in item.iter():
        if _local(el.tag) == "qti-prompt" and _text(el):
            return _text(el)
    for el in item.iter():
        if _local(el.tag) == "p" and _text(el):
            return _text(el)
    return item.get("title", "").strip()


def _item_to_question(item: ET.Element, index: int) -> dict[str, Any]:
    qid = item.get("identifier") or f"q{index + 1}"
    prompt = _prompt_for(item)
    choice = next((el for el in item.iter() if _local(el.tag) == "qti-choice-interaction"), None)
    if choice is not None:
        options = [_text(c) for c in choice.iter() if _local(c.tag) == "qti-simple-choice"]
        return {"id": qid, "prompt": prompt, "kind": "choice", "options": options}
    return {"id": qid, "prompt": prompt, "kind": "text"}


def parse_qti(xml: str) -> list[dict[str, Any]]:
    """Parse QTI XML into a list of PIE question dicts."""
    root = ET.fromstring(xml)
    if _local(root.tag) == "qti-assessment-item":
        items = [root]
    else:
        items = [el for el in root.iter() if _local(el.tag) == "qti-assessment-item"]
    return [_item_to_question(item, i) for i, item in enumerate(items)]


def qti_to_exam(xml: str, exam_id: str, title: str, duration_seconds: int = 1800) -> dict[str, Any]:
    """Build a full PIE exam from QTI XML."""
    return {
        "id": exam_id,
        "title": title,
        "durationSeconds": duration_seconds,
        "questions": parse_qti(xml),
    }
