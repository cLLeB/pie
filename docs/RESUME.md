# PIE — Resume Here (session handoff)

**Read this first when picking the project back up.** Last updated end of session 2026-06-30.

PIE = **Platform for Intelligent Examinations** — browser-based exam proctoring whose differentiator
is **Proof-of-Authorship** (certify the work is the verified person's own, instead of surveilling).
GitHub: **https://github.com/cLLeB/pie** (branch `main`, everything pushed).

## How to run it (verify-loop with a human in the browser)

```bash
npm install
npm test                                  # ~161 tests across 4 packages, all green
npm run dev -w @pie/candidate             # exam app  → http://localhost:5173
npm run dev -w @pie/review                # review console → http://localhost:5174
# optional backend (server-side signing, exam delivery, identity, QTI/LTI):
cd services/server && python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn pie_server.app:app --port 8000
# point the candidate app at it:  $env:VITE_PIE_SERVER="http://localhost:8000"; npm run dev -w @pie/candidate
```

Test secret for the review console: `pie-demo-tenant-secret`.

## What is BUILT and browser-VERIFIED ✅
(Full per-area detail in `docs/STATUS.md`.)
- **Proof-of-Authorship core** (`@pie/integrity-core`): tamper-evident hash-chained ledger,
  keystroke provenance + **replay**, HMAC signing (**cross-language pinned** to the Python server),
  verify, portable certificate package, **fusion engine** (paste-after-focus-loss, pasted-content,
  fast-choice, frequent-look-away, frequent-voice, excessive-focus-loss).
- **Candidate app**: exam runner, native-beforeinput provenance (typed vs **pasted** — verified),
  kind-aware **choice** answers, glass-box, signed certificate + download, server signing w/ offline
  fallback, countdown timer + auto-submit, **opt-in camera+mic** (face presence, look-away, voice,
  continuous-identity frame capture).
- **Review console**: file-load a certificate, verify (chain+root+signature), **replay** scrubber,
  **Integrity flags** panel, tamper simulation, **live secret**.
- **Server** (`services/server`, FastAPI): events, signing, verify, certificate registry, identity
  proxy to the biometric `/v1`, exam delivery, **SQLite** persistence, CORS, Docker/compose,
  **QTI 3.0 import**, **LTI 1.3 launch** validation.
- **MV3 extension** (`apps/extension`): multi-monitor/window signals via a validated postMessage
  protocol; builds to a loadable `dist/`.

Browser-verified by the user across rounds: provenance typed-vs-paste, choice handling, fusion
flags, replay, file-load, tamper detection, certificate sign/verify, face presence (with lean-in
tolerance), timer.

## ⚠️ OPEN / IN-PROGRESS when we paused — camera gaze + mic calibration
The camera/mic signals work mechanically but the **thresholds aren't dialled in**. This is the hard
part (attention detection). A live **debug readout** is shown under the webcam preview:
`f{faces} · yaw {}° · pitch {}° · eye {} · mic {}`. Use it to calibrate.

**Observed numbers (FaceLandmarker head pose):**
- Facing forward normally: `yaw -4° · pitch 1°` → correctly "on screen".
- Moderate tilt: `yaw -18° · pitch -26°` → flagged "looking away" (good).
- Head bowed fully down OR turned to profile: **face is LOST (`faces 0`)** → reported as "no face"
  (presence), gaze row hidden. The model can't track extreme angles.

**Current thresholds (in code, provisional):**
- Head pose: `isFacingScreen` in `apps/candidate/src/vision/pose.ts` — `yawLimit 22`, `pitchLimit 18`,
  `pitchCenter 0`.
- Eye aversion: `EYE_AWAY_THRESHOLD = 0.5` in `apps/candidate/src/vision/mediapipeFace.ts`
  (eye-gaze via blendshapes — `apps/candidate/src/vision/eyegaze.ts`). **Not yet validated against
  real `eye` readings** — need the user's `eye` value when (a) looking at screen, (b) eyes-down at
  lap, (c) eyes-to-side. Set the threshold between the "at screen" and "averted" values.
- Voice: `VOICE_THRESHOLD = 0.02` in `apps/candidate/src/exam/WebcamMonitor.tsx`; sustain =
  `AudioActivitySensor(..., 4)` in `apps/candidate/src/exam/session.ts` (≈1s; rejects coughs).
  User feedback: 0.035 was too high for normal/distant speech; 0.02 is the current guess — confirm
  against the user's real speaking `mic` value.

**To finish gaze/voice:** get the user's `eye` and `mic` readings in the poses above and set the two
thresholds. Consider: gaze is "evidence for human review", so erring toward over-flagging is fine.
A more robust path if needed: iris-landmark gaze, or accept head-pose+eye as-is and flag generously.

## REMAINING ROADMAP (next sessions)
1. **Finish gaze/voice calibration** (above) — quickest win, needs user numbers.
2. **Object/phone detection** — YOLOv8n via ONNX-Web → `ProhibitedObjectSensor` (already built &
   tested in core); wire a detector in the candidate like the face one. Browser/GPU.
3. **Continuous identity end-to-end** — stand up the biometric `/v1` service
   (`C:\Users\kyere\Documents\codes\contactless-fingerprint-system`), enrol the test user, set
   `VITE_PIE_USER_ID`, confirm "Identity: verified ✓" flows (server endpoint + client loop already built).
4. **LMS depth** — full LTI 1.3 OIDC login-init handshake (only the launch/id_token validation is
   done) + Caliper events; QTI import already works.
5. **Autosave/resume** — persist the event stream/provenance to survive a refresh while keeping the
   hash chain valid.
6. **Postgres + object store** behind the `EventStore` Protocol (SQLite done); bundle the biometric
   engine into `docker-compose.yml`.
7. **Hardening** — security review (extension + server), bias audit of the identity step,
   accessibility pass, pilot validation that provenance separates authored vs pasted without false
   positives. Plus the deferred research-completeness items (clone+run OSS repos, full-read papers,
   business-model + legal/region pass).

## Key facts / gotchas
- **Commit signing**: global `commit.gpgsign=true`; in non-interactive shells commits hang on the
  GPG pinentry dialog until the user enters the passphrase. Don't bypass signing — wait/retry.
- Monorepo: npm workspaces, packages scoped `@pie/*`; server is Python (separate venv).
- Design docs: `docs/research/01..04`; build plan: `docs/superpowers/plans/2026-06-30-integrity-core.md`.
