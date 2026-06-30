# Step 2 — Architecture, Trade-offs & Tech Stack

> Input: the weakness list and signal catalog from `01-landscape-dossier.md`.
> Output: how we structure the product to keep the strengths and shed the weaknesses, what we
> deliberately drop (with the opportunity cost named), and the concrete stack.

---

## 1. The four design commitments (each one kills a specific weakness)

| Commitment | Kills weakness # | What it means concretely |
|---|---|---|
| **C1. On-device-first inference** ("flags, not footage") | #1 privacy, #2 bias exposure, #8 breach, #10 bandwidth | Vision/audio/keystroke models run **in the browser** (MediaPipe + ONNXRuntime-Web/TF.js + WebGPU). By default we transmit **events + low-rate evidence thumbnails**, not a continuous video stream. Full video recording is an *opt-in* tier, not the default. |
| **C2. Evidence, not accusations** | #3 false positives, #12 no proof | We never auto-fail. Every signal produces a **weighted, explainable integrity event** with a confidence and a human-review path. The product's output is a **defensible evidence bundle**, not a verdict. |
| **C3. Graduated trust ladder** | #6 friction, #10 bandwidth, plus serves all segments | One exam definition runs across Web-only → +Extension → +Helper → SEB-handoff. Buyer picks the rung per exam; low-stakes quizzes stay zero-install, high-stakes get lockdown. |
| **C4. Integrated assessment + proctoring + identity** | #9 bolt-on, and leverages our owned engine | Proctoring is not a separate bolt-on; it's fused with the exam delivery engine and with **our own biometric API** as the identity layer. Owning identity end-to-end is our structural advantage. |

These four are the spine. Everything below serves them.

---

## 2. System architecture (modular, signal-oriented)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CANDIDATE SURFACE (browser; PWA)                                          │
│  ┌────────────────┐  ┌──────────────────────────────────────────────────┐ │
│  │ Exam Runner    │  │ Integrity Sensor Mesh (all on-device, modular)   │ │
│  │ (QTI items,    │  │  vision: face presence / count / gaze / head-pose│ │
│  │  timer, nav,   │  │          / object(YOLO phone,book) — MediaPipe+ONNX│ │
│  │  autosave)     │  │  audio:  VAD + wake-word (Silero/KWS, WASM)       │ │
│  └──────┬─────────┘  │  identity: ArcFace sampling → our /v1 API         │ │
│         │            │  behavior: keystroke/mouse cadence, paste, focus  │ │
│         │            │  environment: tab/fullscreen/clipboard/VM heur.   │ │
│         │            │  ── each emits typed Integrity Events ──          │ │
│         │            └───────────────┬──────────────────────────────────┘ │
│  ┌──────▼─────────────┐   (+ optional Extension: screen, multi-monitor,   │
│  │ Provenance Recorder│    process; + optional Helper: VM/RDP truth)      │
│  │ (keystroke genesis)│                                                    │
│  └──────┬─────────────┘                                                    │
└─────────┼──────────────────────────────────────────────────────────────────┘
          │  signed event stream (batched; offline-queued)
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PLATFORM (deployable: cloud SaaS │ on-prem │ air-gapped)                   │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Exam/Item   │ │ Integrity    │ │ Identity svc │ │ Evidence & Review  │  │
│  │ service     │ │ Fusion+Score │ │ = OUR /v1 API│ │ console (proctor/  │  │
│  │ (QTI, banks)│ │ (weak-signal │ │ (face/palm,  │ │ instructor)        │  │
│  │             │ │  fusion,     │ │  liveness)   │ │ + audit/export     │  │
│  │             │ │  explainable)│ │              │ │                    │  │
│  └─────────────┘ └──────────────┘ └──────────────┘ └────────────────────┘  │
│  LTI 1.3 / QTI / Caliper connectors  ·  tenant isolation  ·  signed audit  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Module boundaries (each independently testable, per coding-style rules)
- **Exam Runner** — renders items, timer, navigation, autosave; knows nothing about detection.
- **Integrity Sensor Mesh** — a registry of independent **sensor modules**, each: `init() →
  stream of typed IntegrityEvents`. Adding "phone detection" or "keystroke biometrics" is dropping
  in a module; removing one is deleting it. This is the "include all existing signals" requirement
  made tractable — every technique from the catalog is one module.
- **Provenance Recorder** — captures the keystroke-level genesis of each answer (Step 3 core).
- **Extension** (optional) — provides the privileged sensors (screen, multi-monitor, process) over
  a message channel; the web app degrades gracefully without it.
- **Helper** (optional, Tauri) — VM/RDP ground truth + true kiosk for high-stakes.
- **Integrity Fusion+Score** — server-side; consumes events, fuses weak signals into an explainable
  integrity timeline + score with confidences. Never emits a verdict; emits evidence.
- **Identity service** — **literally our existing `contactless-fingerprint-system` `/v1` API**,
  deployed alongside (it's already multi-tenant, encrypted, offline-capable, Dockerized).
- **Evidence & Review console** — proctor/instructor UI: timeline, flagged moments, side-by-side
  identity checks, export to a signed, tamper-evident bundle.

---

## 3. Tech stack

| Layer | Choice | Why (vs alternatives) |
|---|---|---|
| Candidate web app | **React + TypeScript + Vite**, PWA | Owner already ships React/Vite (ephemeral-drops). Reuse skills; offline PWA shell matters for low-bandwidth/lab. |
| On-device vision | **MediaPipe Tasks (Web)** + **ONNXRuntime-Web** (WebGPU→WASM fallback) | MediaPipe gives face mesh/landmarks/gaze/hands out of the box; ONNX-Web runs YOLOv8n & ArcFace client-side; WebGPU for speed, WASM fallback for old devices. |
| On-device audio | **WebAudio + Silero VAD (WASM)** + small KWS | Proven, tiny, runs offline; powers VAD + wake-word. |
| Identity/biometrics | **Reuse `contactless-fingerprint-system` `/v1`** (ArcFace, liveness, palm) | Already built, encrypted, multi-tenant, offline. Our moat — do not rebuild. |
| Keystroke/behavior | Custom TS module + server scorer | Lightweight; the data is the value (Step 3). |
| Extension | **Manifest V3 (Chrome/Edge)** | Where the high-value lockdown signals live; minimal permissions, security-reviewed. |
| Optional helper | **Tauri (Rust)** | Tiny binary vs Electron; needed only for VM/RDP truth + kiosk; matches owner's existing Tauri work. |
| Exam/Item service | **Python FastAPI** (or Flask to match the biometric service) | Same language as the biometric engine → one ops story; QTI parsing libs exist in Python. |
| Fusion/scoring | **Python** (numpy/onnx; rules + small model) | Co-located with item service; explainable scoring. |
| Datastore | **PostgreSQL** + object store (MinIO/S3) for evidence thumbnails | Standard; MinIO enables on-prem/air-gapped. |
| Realtime | **WebSocket** (event stream), batched + offline queue | Survives flaky networks; lab/air-gapped friendly. |
| Standards | **LTI 1.3 + QTI 3.0 + Caliper** connectors | Table stakes for the education buyer; lets us embed in Canvas/Moodle/Blackboard. |
| Deploy | **Docker Compose** (single-node on-prem) + Helm (cloud) | Biometric service is already Docker; one-command on-prem install for universities. |

**Why FastAPI/Flask + Python everywhere on the server:** the highest-value, hardest-to-rebuild
asset (the biometric engine) is Python/Flask. Matching it means one runtime, one deploy, one team —
not a polyglot ops burden. The differentiated work is the **fusion layer and provenance**, not the
web framework.

---

## 4. What we deliberately drop (opportunity-cost ledger)

YAGNI, explicitly. Each "drop" lists what we give up and why it's worth it.

| We DON'T build | Opportunity cost (what we lose) | Why it's the right call |
|---|---|---|
| A native lock-down **browser** (SEB/Respondus clone) | Strongest possible OS lockdown by default | Owner's explicit constraint; SEB owns it & is free; we **handoff to SEB** for the top rung instead. |
| **Default continuous video recording/streaming** | The "watch everything" assurance some buyers expect | It's the source of the privacy/bias/breach/bandwidth weaknesses. We make it opt-in, not baseline. Sell evidence, not footage. |
| **AI-text detection as a verdict** | Marketing checkbox "detects ChatGPT" | Proven unreliable (OpenAI/Turnitin). We replace it with **provenance** (Step 3), which actually holds up. Keep a weak AI-text prior only as a non-deciding hint. |
| **In-house live human proctoring marketplace** | Recurring services revenue; the live tier | Ops-heavy, low-margin, privacy-fraught. We support **escalate-to-human** hooks so institutions use their own invigilators; we stay software. |
| **Our own face-recognition model** | Control | We already **own** one (`contactless-fingerprint-system`). Reuse, don't rebuild. |
| Heavy **mobile native apps** at v1 | Some mobile-exam markets | PWA covers most; phone is better used as the **second-camera** companion than a full client early on. |
| Boiling the ocean on every exotic signal at v1 | Completeness | Sensor-mesh modularity lets us **add any signal later** as a module. Ship the high-value core first. |

---

## 5. Build order (phased; risk-front-loaded)

1. **Identity spine** — wire the biometric `/v1` into an enrollment + pre-exam check + sampled
   continuous-identity loop. (Highest value, lowest risk — the asset exists.)
2. **Exam Runner + event pipeline** — QTI items, timer, autosave, signed offline-queued event
   stream, Postgres. (The skeleton everything attaches to.)
3. **Sensor mesh v1 (pure web)** — tab/focus, fullscreen, clipboard/paste, face presence/count,
   gaze/head-pose, keystroke cadence. (All zero-install signals.)
4. **Provenance Recorder + Fusion/Score + Evidence console** — the differentiator (Step 3) and the
   review UI that turns events into a defensible bundle.
5. **Extension** — screen, multi-monitor, process, VM heuristics. (Unlocks the high-stakes tier.)
6. **LTI 1.3 / QTI / Caliper** — LMS embedding. (Distribution.)
7. **Helper + SEB-handoff** — top rung for licensure/high-stakes.
8. **Second-camera companion, object/audio models, content-leak protection** — fast-followers.

---

## 6. Cross-cutting non-negotiables (from the weakness list)
- **Bias guardrails:** every biometric/gaze decision has a confidence; low confidence → human
  review, **never auto-fail**; lighting-robust capture; documented bias testing; allow non-camera
  identity (keystroke/palm) as accommodation.
- **Security of the proctor:** MV3 extension with least privilege; the Helper is signed; both get a
  security review (remember Proctorio's UXSS). The proctor must never be the exploit.
- **Privacy/compliance by construction:** on-device default; store events + minimal evidence;
  encryption at rest (the biometric engine already does this); explicit consent flows;
  right-to-erasure; data-residency via on-prem deploy.
- **Offline/air-gapped parity:** everything must run with no internet (models bundled, event queue
  drains to a local server). This is free differentiation our cloud-only competitors can't match.
