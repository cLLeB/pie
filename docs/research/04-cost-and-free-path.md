# Step 2b — The Cost Model: Free by Construction, Cheap When Necessary

> Requirement (owner): there must be a path where the **whole process is free**, or at minimum
> **cheap when necessary**. This document shows why that's structurally possible *for us and almost
> no incumbent*, and how to keep it sustainable.

---

## 1. Why incumbents can't be free (and we can)

Proctoring is expensive because of **three structural costs** — every one of which our Step-2
architecture already removes:

| Incumbent cost driver | Typical $ | Our architecture | Our marginal cost |
|---|---|---|---|
| **Live human proctors** | $8–25 / exam (ProctorU, Honorlock live) | Escalate to the **institution's own invigilators**; we stay software | **$0** |
| **Cloud video storage + streaming** (hours of webcam+screen per student, kept months) | the silent budget-killer; huge egress/storage | **On-device inference; "events, not footage"** — we move KB of signed events, not GB of video | **~$0** |
| **Server-side GPU inference** on video | GPU fleet | Inference runs **in the student's browser** (MediaPipe/ONNX-Web/WebGPU); identity engine is **CPU-only** | **~$0** |

The marginal cost of one more proctored exam, in our default mode, **approaches zero.** That's not
a pricing choice — it's a consequence of on-device-first + flags-not-footage. An incumbent built on
cloud video *cannot* match a free tier without destroying their own margins. **Free is our moat,
not our loss leader.**

---

## 2. The free path (genuinely $0 to operate)

Everything in the **default rung** of the trust ladder is free to run:

- **Self-host / open-core:** the institution runs the Docker stack (exam service + fusion + our
  biometric `/v1`, all CPU-only, all offline-capable) on **their own hardware**. Zero infra cost to
  us, zero per-seat cost to them. Air-gapped university labs get full proctoring for the price of a
  server they already own. This is the path incumbents literally cannot offer.
- **On-device sensor mesh:** tab/focus, fullscreen, clipboard/paste, keystroke-genesis provenance,
  face presence/count/gaze, liveness — all compute on the candidate's machine. No server bill.
- **Authenticity Certificate:** just a hash chain + a signature (the engine already HMAC-signs).
  Free to generate, free to verify.
- **Free-quiz mode:** keystroke + identity provenance, **zero camera, zero video** → instant
  certificate at essentially no cost. Makes integrity viable for *free, low-stakes quizzes* — a
  market incumbents can't touch because their unit economics need a paid seat.
- **No paid AI APIs in the core.** The provenance approach deliberately avoids per-call LLM/AI-text
  detection fees (which don't work anyway, per Step 1). All models are free/open (MediaPipe,
  YOLOv8n, Silero VAD, ArcFace via the owned engine). No metered third-party dependency in the hot
  path.

> Net: a school, a bootcamp, or a single instructor in a low-resource setting can run the **entire
> process for $0**, self-hosted, offline, forever.

---

## 3. "Cheap when necessary" — pay only for the rung you turn on

Cost should scale with *need*, not be a flat tax. Because the system is a **modular mesh on a
graduated ladder**, you pay only when you enable something that genuinely costs money:

| You turn on… | Why it costs | Rough cost shape |
|---|---|---|
| On-device signals + certificate (default) | nothing | **free** |
| **Managed cloud hosting** (don't want to self-host) | tiny event storage + minimal evidence thumbnails | **cents/exam**, not dollars |
| **Opt-in video recording** tier | the *only* thing that adds real storage/bandwidth | pay for storage you actually use |
| **Premium modules** (content-leak "search & destroy", advanced fusion model, deep analytics) | our ongoing R&D/ops | per-feature add-on |
| **Certificate registry / verify-at-scale** (public "Verified by [Brand]" checks) | hosted trust service | usage-based |
| **Enterprise** (SSO, SLA, audit support, on-prem support contract) | human support | annual |

The expensive things (video, humans, premium R&D) are **opt-in and isolated**, so turning them off
returns you to free. Nobody pays for surveillance they didn't ask for.

---

## 4. The business model that keeps free sustainable: **open-core**

Same pattern as GitLab / Supabase / Metabase — a real free product, monetized at the edges:

- **Free / open (self-host):** exam runner, full on-device sensor mesh, provenance + certificate,
  identity engine, LTI/QTI. Unlimited. This drives adoption.
- **Paid (convenience + scale + enterprise):** managed cloud, video tier, premium detection
  modules, the hosted certificate-verification registry, analytics, SSO/SLA/support.

**Why this is also the go-to-market for the sauce:** the free path *is* the distribution strategy.
Free + self-host → wide adoption → the **Authenticity Certificate** gets recognized in more places →
the portable "Verified authorship" mark approaches a *de facto standard* (Step 3's "become known").
A paid-only product can't seed a standard; a free one can. Free adoption and the certificate's
network effect are the same flywheel.

---

## 5. Cost-minimization rules to bake in from day one
1. **On-device by default; server only coordinates** (storage, auth, fusion of tiny events).
2. **Events, not footage** — video is opt-in and isolated to its own cost line.
3. **CPU-only models** (the biometric engine already is) — no GPU fleet required to operate.
4. **Open/free models only in the core** — no metered third-party AI in the hot path.
5. **Self-host parity** — every feature must work offline/on-prem, so "free forever" is always real.
6. **Free-tier caps that protect cost, not capability** — cloud free tier caps *volume/video*, never
   the integrity guarantees; self-host is uncapped.
7. **Phone-as-second-camera over a paid second device** — reuse the student's own hardware.

---

## 6. Honest caveats
- **Our hosted costs aren't literally zero** — auth, event storage, the certificate registry, and
  CI/support cost *something*. The point is the **marginal cost per exam is ~free in default mode**,
  so a generous free tier and a $0 self-host path are sustainable; we charge for video, scale, and
  human-touch — the things that actually cost.
- **Free must not mean abandoned** — open-core only works with real maintenance; budget for it.
- **Premium must be genuinely additive** (scale, video, leak-protection, support), never paywalling
  the core integrity promise — paywalling trust would betray the whole "humane" positioning.
