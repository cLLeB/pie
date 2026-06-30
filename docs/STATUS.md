# PIE — Build Status & Road to 100%

Honest tracking of what's built vs. what "100% / production" requires. Updated 2026-06-30.

## Tests: 63 passing (integrity-core 49 · candidate 10 · review 4). All typecheck + build clean.

## Done ✅
- [x] **Research & design** — 4-doc dossier (landscape, architecture, sauce, cost) in `docs/research/`.
- [x] **`@pie/integrity-core`** — the Proof-of-Authorship engine (framework-agnostic TS):
  - [x] SHA-256 + canonical serialization
  - [x] Tamper-evident hash-chained ledger (`verifyChain` pinpoints tampering)
  - [x] Provenance: edit-ops model, authorship metrics (pasteRatio), replay
  - [x] Sensor mesh: `Sensor` interface, `SensorMesh`, `VisibilitySensor`, `FullscreenSensor`
  - [x] `ProvenanceRecorder` (InputEvent → ops)
  - [x] `AuthenticityBundle` assembler (carries ops for replay)
  - [x] HMAC certificate signing + `verifyCertificate` + `verifySignedBundle`
- [x] **`@pie/candidate`** — React PWA exam runner: live provenance capture, sensor mesh wired
      (focus/visibility/fullscreen/clipboard), glass-box transparency panel, signed certificate on submit.
- [x] **`@pie/review`** — instructor console: verify signed certificate (chain + root + signature),
      per-answer authorship metrics, **keystroke replay scrubber**, tamper simulation.

## In progress / next (the road to 100%)
- [ ] **Candidate ↔ review handoff** — export certificate package (JSON/file) from candidate; import in review.
- [ ] **Server (`@pie/server`, FastAPI)** — exam/item delivery, event ingestion (signed, offline-queued),
      **server-side signing** with per-tenant secret, certificate registry + public verify endpoint,
      Postgres + object store. Moves signing off the client (currently a demo secret).
- [ ] **Identity integration** — wire the existing biometric `/v1` API as the WHO: enrollment,
      pre-exam check, sampled continuous-identity loop; bind identity events into the ledger.
- [ ] **On-device vision sensors** — MediaPipe FaceMesh/ONNX-Web: face presence/count, gaze/head-pose,
      phone/object (YOLOv8n). Privacy-first (events, not footage).
- [ ] **Timer + exam lifecycle** — countdown, autosave, resume, submit deadlines.
- [ ] **LMS integration** — LTI 1.3 launch + QTI item import + Caliper events.
- [ ] **Browser extension (MV3)** — screen/multi-monitor/process signals for the high-stakes rung.
- [ ] **Deployment** — Docker Compose (on-prem/air-gapped) + cloud; bundle the biometric engine.
- [ ] **Hardening** — security review (extension/helper), bias audit of identity step, accessibility,
      pilot validation that provenance separates authored vs. pasted without false positives.
- [ ] **Research-completeness** — clone + run the OSS reference repos; full-read the key papers;
      business-model + legal/region pass (GDPR/BIPA).

## Definition of "100%"
A self-hostable, LMS-embeddable exam platform where a candidate sits a proctored exam in the browser,
on-device sensors + the biometric engine produce a signed, tamper-evident Authenticity Certificate,
and an instructor verifies and replays it — running free on-prem, with the paid cloud/video tiers
optional. We have the **core loop**; the list above is the remaining surface.
