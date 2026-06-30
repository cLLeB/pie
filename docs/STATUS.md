# PIE — Build Status & Road to 100%

Honest tracking of what's built vs. what "100% / production" requires. Updated 2026-06-30.

## Tests: 136 passing (integrity-core 74 · candidate 21 · review 9 · server 32). TS+Py, all green.

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

- [x] **Candidate ↔ review handoff** — `serializeCertificatePackage`/`parseCertificatePackage`;
      candidate downloads `pie-certificate-*.json`, review console imports + verifies it. Loop closed.

- [x] **Server (`@pie/server`, FastAPI)** — event ingestion, **server-side HMAC signing** (per-tenant
      secret, **byte-identical to the TS signer**, cross-language test pinned), verify endpoint,
      certificate registry. 11 pytest. (Persistence still in-memory → Postgres/object-store next.)

- [x] **Wire candidate → server signing** — injectable `serverThenLocal` signer (server-side signing
      with offline local fallback); CORS configurable; mocked-fetch tests.
- [x] **Identity layer (server)** — `/v1/identity/verify` fronting the biometric `/v1` (injectable
      `IdentityClient`, httpx MockTransport test). Next: candidate continuous-identity loop binding
      identity results into the ledger as events.
- [x] **Exam delivery (server)** — `GET /v1/exams/{id}` + `ExamRepo`. Next: candidate fetches it; QTI import.
- [x] **Deploy scaffold** — server `Dockerfile` + root `docker-compose.yml` (on-prem, offline).
- [x] **Persistence** — durable `SqliteStore` behind `EventStore` Protocol (offline single-file);
      compose mounts a volume. Postgres/object-store can follow behind the same Protocol.
- [x] **On-device vision** — MediaPipe BlazeFace face presence wired into the candidate (opt-in
      camera, lazy-loaded, on-device → ledger + glass-box). Gaze/pose + YOLO objects next (cores done).
- [x] **Fusion/scoring engine** — `analyzeIntegrity`: paste-after-focus-loss, identity-mismatch,
      excessive focus loss, pasted-content, fast-choice; ranked flags shown in the review console.
- [x] **Kind-aware answers** — objective (choice) questions use selection/timing/changes provenance;
      paste flagging triggers on ANY paste (not just 100% ratio) to defeat dilution.
- [x] **MV3 browser extension** — multi-monitor/window signals via a validated postMessage protocol
      (shared in core); candidate records them; builds to a loadable `dist/`.
- [x] **LMS** — `POST /lti/launch` (LTI 1.3 id_token RS256 validation) + `POST /v1/exams/import-qti`
      (QTI 3.0 → PIE exam). Full OIDC login-init handshake + Caliper still to add.
- [x] **Certificate file load** — review console loads the downloaded `.json` directly (FileReader).
- [x] **Sensor catalog (cores)** — visibility, fullscreen, face-presence, gaze (dwell-thresholded),
      prohibited-object, multi-monitor, keystroke provenance — injectable, tested modules.
- [ ] **Remaining vision models** — gaze/head-pose + YOLOv8n objects via ONNX-Web (browser/GPU).
- [ ] **Timer + exam lifecycle** — countdown, autosave, resume, submit deadlines.
- [ ] **Deployment polish** — bundle the biometric engine into compose; cloud Helm.
- [ ] **Hardening** — security review (extension/helper), bias audit of identity step, accessibility,
      pilot validation that provenance separates authored vs. pasted without false positives.
- [ ] **Research-completeness** — clone + run the OSS reference repos; full-read the key papers;
      business-model + legal/region pass (GDPR/BIPA).

## Definition of "100%"
A self-hostable, LMS-embeddable exam platform where a candidate sits a proctored exam in the browser,
on-device sensors + the biometric engine produce a signed, tamper-evident Authenticity Certificate,
and an instructor verifies and replays it — running free on-prem, with the paid cloud/video tiers
optional. We have the **core loop**; the list above is the remaining surface.
