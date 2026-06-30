# Step 1 — Landscape Dossier: Browser-Based Proctoring

> Goal of this document: gather **everything** worth knowing about online exam proctoring done
> in (or near) the browser — every credible platform's strengths, their weaknesses, every
> monitoring technique anyone uses, what the research says, and what's actually evadable. This
> is the raw intelligence. Step 2 turns it into architecture; Step 3 turns it into our edge.
>
> Scope decision (per owner): **general-purpose, browser-first**. We do NOT build a native OS
> app — Safe Exam Browser already owns the native-lockdown niche. We live in the browser (web
> app + optional browser extension + optional thin helper). We cover the full market: remote
> unsupervised, remote live-proctored, BYOD, AND supervised computer-lab — not one narrow case.

---

## 0. The one-paragraph state of the field (2026)

Proctoring is a ~$1B+ market built on a shrinking lie. The first generation (Proctorio,
Respondus, ProctorU/Meazure, Honorlock, Examity, Proctortrack, ExamSoft, Mettl, Talview,
Examus/Constructor) sells **surveillance**: record the student's camera, mic, and screen, run
CV/ML over it, and flag "suspicious" behavior for a human to review. Three forces are breaking
this model: (1) a **privacy/ethics/legal backlash** (bias against dark skin and neurodivergent
students, lawsuits, campus bans, EFF/press hostility); (2) **AI cheating** — ChatGPT on a second
device defeats camera-based proctoring entirely, and the AI-text detectors that were supposed to
catch it have **collapsed** (OpenAI retired its detector in 2025; Turnitin disclaims sole
reliance); and (3) **the arms race is lost on evasion** — VMs, second phones, screen mirroring,
and paid proxy test-takers are documented and easy. The opportunity is to stop selling
surveillance and start selling **provable integrity** with **privacy by construction**.

---

## 1. Market segments (who buys, and what they actually need)

| Segment | Primary fear | What they'll pay for | Notes for us |
|---|---|---|---|
| Universities — high-stakes exams | Impersonation, contract cheating, AI | Defensible audit trail, LMS integration, low false-positive rate | Our beachhead. Care about due process & evidence. |
| Professional certification / licensing | Credential value collapse if cheating is easy | Strong identity, legally-defensible records, tamper-evidence | Highest willingness to pay; strictest. |
| Corporate hiring / skills assessment | Proxy candidates, AI-assisted coding | Throughput, candidate experience, ATS hooks | High volume, lower stakes per test. |
| Online courses / bootcamps / MOOCs | Cheap, embeddable integrity that doesn't scare learners | API-first, self-serve, low/no install | Price-sensitive; privacy-first is a selling point. |
| K-12 / schools | Age-appropriate, parental consent | Light-touch, no creepy biometrics | Avoid heavy biometrics; consent flows. |
| Supervised computer labs (a key use case) | Impersonation + device-side cheating despite an invigilator in the room | On-prem/offline, identity binding, lab dashboards | Our owned offline biometric engine shines here. |

**Design consequence:** the product must be **modular by monitoring signal** and **deployment-mode
agnostic** (cloud SaaS, on-prem/air-gapped, hybrid), because these segments want very different
subsets. A monolith tuned for one segment loses the others.

---

## 2. Commercial platform teardown

Ranked by relevance to a browser-first build. "Browser model" = how they reach the student.

### 2.1 Proctorio
- **Browser model:** Chrome/Edge **extension** + LMS (Canvas/Moodle/etc.) via LTI. No standalone app.
- **Strengths:** Fully automated (no human in loop → cheap, infinite scale). Extension unlocks
  signals pure web can't get: **screen recording, multi-monitor detection, process/clipboard
  control, forced single-tab**. "Zero-knowledge" encryption marketing — institution holds keys.
  Configurable per-exam (toggle each lockdown/recording feature). Deep LMS gradebook integration.
- **Weaknesses:** Extension is trivially disabled/uninstalled after exam; **a 2021 audit found a
  Universal XSS vuln** in the extension (any site could exploit it) — shows the attack surface of
  a high-privilege extension. Pure-automation means **high false-positive rate** → student
  anxiety and appeals. Repeated press/EFF criticism for surveillance. Bias complaints (lighting
  prompts for dark-skinned students). Detectable & evadable (VM, second device).
- **Take for us:** The extension-unlocks-more-signals model is correct. The all-automation /
  flag-everything posture is the reputational liability we must NOT copy.

### 2.2 Respondus (LockDown Browser + Monitor)
- **Browser model:** A **downloadable custom browser** (Chromium fork) — *not* pure web. "Monitor"
  adds webcam AI on top. Tight Moodle/Canvas/Blackboard/D2L/Brightspace integration.
- **Strengths:** Strong lockdown because it's a real app (kills copy/paste, printing, other apps,
  VMs). Ubiquitous in US higher-ed; instructors trust it. Cheap site licenses.
- **Weaknesses:** It's effectively a native app → the exact thing the owner says is "no room" /
  saturated. Clunky student UX, install friction, frequent support tickets. Webcam AI is basic.
- **Take for us:** This is the SEB-adjacent space we deliberately avoid building. But note its
  *lockdown feature checklist* — we replicate as much as possible via web+extension.

### 2.3 Honorlock
- **Browser model:** Chrome **extension** + live-proctor escalation ("AI + humans on standby").
- **Strengths (the most forward-looking commercial player):**
  - **Patented phone/second-device detection** — flags visible handheld devices and detects
    **nearby Apple devices / Apple Handoff**; "Smart Voice Detection" listens for wake-words
    ("Hey Siri", "Alexa") that imply a second device running an AI assistant.
  - **"Search & Destroy"** — proactively crawls the web (Chegg, Course Hero, brain-dump sites) for
    leaked exam questions and issues takedowns; can detect when a student visits such a site.
  - **Hybrid model:** AI watches in the background, escalates to a human only on a trigger →
    fewer false accusations than pure automation, cheaper than full live proctoring.
  - Turnitin LTI integration for AI-writing detection (though see §6 — that detection is weak).
- **Weaknesses:** Still camera-centric; still defeated by an off-camera second device / VM.
  Live-proctor escalation has cost & privacy implications. US-centric.
- **Take for us:** **Steal the philosophy** — multi-signal, escalate-on-trigger, content-leak
  protection, second-device awareness. These are the genuinely good ideas in the market.

### 2.4 ProctorU / Meazure Learning
- **Browser model:** Extension + heavy **live human proctoring** (and "Record+" automated tier).
- **Strengths:** Human proctors catch context AI misses; identity checks; incident reports built
  for institutions. Strong in licensure.
- **Weaknesses:** Expensive, schedule-bound, privacy-heavy (a human watches your room), known
  data-breach history in the industry. Doesn't scale to free quizzes.

### 2.5 Examity
- Workflow/scheduling layer + tiered proctoring (auto → record → live). Strength: flexible
  service tiers and institutional workflow. Weakness: integrator, not a tech leader; UX dated.

### 2.6 ExamSoft / Examplify
- **Browser model:** **Native locked app** (Examplify) — offline exam download, encrypts answers
  locally, uploads later. Dominant in high-stakes (bar exams, nursing/NCLEX, med schools).
- **Strengths:** True offline high-stakes delivery; **VM detection** (e.g., flags CPU temp
  reading 100 °C — a known VM default); strong analytics/psychometrics.
- **Weaknesses:** Native app; infamous 2020 bar-exam facial-recognition failures for
  dark-skinned examinees. Again, the native niche we avoid — but the **offline-encrypted-answer
  pattern** is worth porting to a web/extension form for lab/air-gapped use.

### 2.7 Others worth cataloguing
- **Proctortrack** — continuous biometric "active ID" re-verification during the exam (face every
  N seconds). Strength: continuous identity (what our engine does natively). Weakness: same
  surveillance/bias issues; was breached in 2020.
- **Mettl (Mercer) / Talview / iMocha** — assessment-platform-first, proctoring bundled; strong
  in corporate hiring; AI + record-and-review; good question banks. Lesson: **the assessment
  engine and the proctoring are bundled** — buyers want one product, not a bolt-on.
- **Examus / Constructor Proctor** — heavy ML behavior analytics, EU presence, "proctoring score."
- **ProctorExam** — clean **LTI 1.3** external-tool model; **multi-camera** (use your phone as a
  second camera filming the room/desk) — a clever browser-feasible technique.
- **Sumadi, TestInvite, Conduct Exam, Talview** — long tail; mostly recombine the same signals.

### 2.8 Cross-cutting commercial patterns (the "best of all worlds" to absorb)
1. **Tiered proctoring**: automated-only → record-and-review → live-on-trigger → fully live. Buyers
   choose per exam. We must support this gradient.
2. **Extension unlocks the high-value signals** (screen, multi-monitor, process, clipboard).
3. **Second-device detection** is the current commercial frontier (Honorlock's moat).
4. **Content-leak protection** (Search & Destroy) is a differentiator buyers love.
5. **Continuous identity re-check** (Proctortrack) — we already own this capability.
6. **Bundled assessment engine** beats pure bolt-on proctoring for most buyers.
7. **LMS/LTI 1.3 + QTI** is table stakes for the education segment.

---

## 3. Open-source teardown (what we can clone / harvest)

All are **reference implementations / student or research projects** — good for harvesting models
and techniques, none production-grade. Recommended to clone the starred ones and port ideas.

| Repo | Stack | What it gives us | Quality |
|---|---|---|---|
| **vardanagarwal/Proctoring-AI** ⭐ | Python, OpenCV, dlib, TF | The canonical reference: face detection, **head pose** (face landmarks → pose), **eye/gaze tracking**, mouth-open detection, **phone/person detection (YOLO)**, audio (speech→text) | Most-cited; messy but complete technique catalog |
| **AutoOEP** (arXiv 2509.10887) | Python, **ArcFace**, CV | Multi-modal framework: **continuous identity via ArcFace** (same as our engine), head pose, gaze, mouth movement, hand/object module. Academic but current SOTA shape | Best architectural reference |
| **rajrajhans/examsecure** | React + Flask, TF.js | **Browser-side** face & object detection on webcam frames; a real web architecture to study | Good web pattern reference |
| **aungkhantmyat/The-Online-Exam-Proctor** | Python, **YOLOv8** | Face verification, **liveness**, multi-face, distraction detection with modern YOLOv8 | Modern detector reference |
| **SamratSengupta/exam-proctoring-video-analytics** | Python, CNN | Face recog + head pose + eye gaze pipeline | Pipeline reference |
| **kamlendras/OpenProctor** | **Next.js + TS** | A clean web app skeleton for proctoring UI | Frontend skeleton candidate |
| **AparGarg99/Intelligent-Online-Exam-Proctoring-System** | Python | Auth + abnormal-behavior monitoring, decent docs/report | Good written analysis |

**Harvest plan:** take the *techniques and model choices* (YOLOv8 for object/person/phone, MediaPipe
FaceMesh for gaze/head-pose, ArcFace for identity — which we already have), but **re-implement the
client path in-browser** (MediaPipe Tasks + ONNXRuntime-Web / TF.js + WebGPU) so detection runs
on-device. None of these open-source projects do privacy-preserving on-device inference well —
that's open ground for us.

---

## 4. Master catalog of monitoring signals (browser-feasible)

The complete menu. For each: **what**, **how in a browser**, **value**, **evasion/weakness**.
"Pure web" = works in any browser with permissions. "Ext" = needs our extension. "Helper" = needs
optional thin desktop helper (Tauri). We design every signal as an independent, toggleable module.

### A. Identity & continuous presence (our home turf)
| Signal | How (browser) | Value | Evasion / caveat |
|---|---|---|---|
| Pre-exam ID verification | Webcam capture → ArcFace 1:1 vs enrolled, or vs gov ID photo (OCR/MRZ) | Stops the most common fraud (wrong person) | ID forgery; needs enrollment |
| **Continuous face presence** | On-device face-presence detection every frame (MediaPipe) | Detects "nobody there" / "walked away" | Photo spoof → needs liveness |
| **Continuous identity (same person)** | Sample frame every 20–60s → our `/v1/verify` | Detects mid-exam swap / proxy | Bandwidth/battery → sample + on-device gate |
| Liveness (active) | Head-turn challenge (our engine has this) | Anti-photo/video spoof | Deepfake video injection (emerging threat) |
| Liveness (passive) | Single-shot anti-spoof model (our engine, opt-in) | Frictionless spoof check | Model-specific FAR/FRR |
| Face count | On-device detector: 0 / 1 / >1 faces | "Someone helping" / "left seat" | Off-camera helper |
| **Palm-print** (we own it) | Contactless palm via MediaPipe Hands → CCNet | Alt/secondary biometric, no-face fallback | Niche; novelty value |
| **Keystroke dynamics** | Capture key down/up timing → typing "keyprint" | **Continuous identity w/ no camera**; low-anxiety; great for typed exams | Needs free-text typing; less reliable for MCQ |
| Mouse dynamics | Movement/click cadence biometrics | Weak-signal continuous auth | Low accuracy alone |

### B. Visual environment (camera scene understanding)
| Signal | How | Value | Evasion |
|---|---|---|---|
| **Head pose / off-screen gaze** | MediaPipe FaceMesh → pose & gaze vector | Classic "looking away/down at phone" cue | Neurodivergent false positives — must be lenient/contextual |
| Object detection | YOLOv8/n in-browser (ONNX-Web): **phone, book, paper, earbuds, second screen** | Direct cheating evidence | Off-camera objects |
| Multiple-person detection | Person detector | Collusion/help in room | Off-camera person |
| Room/desk pre-scan | Guided 360° webcam pan; optional phone-as-2nd-camera | Verifies clean environment up front | Re-introduce items after scan |
| Phone-as-second-camera | Pair phone via QR → films desk/hands from the side | Defeats the off-camera blind spot cheaply | Student declines/angles away |
| Gaze-off-screen heatmap | Aggregate gaze over time | Pattern, not single-frame, reduces FPs | — |

### C. Audio
| Signal | How | Value | Evasion |
|---|---|---|---|
| Voice activity detection | WebAudio + Silero VAD (WASM) on-device | "Talking / being coached" | Whispering, text-based help |
| Wake-word / keyword spotting | On-device KWS ("Hey Siri/Alexa") | **Implies a second AI device** (Honorlock's trick) | Manual phone use |
| Multi-voice / second-voice | Speaker-change detection | Someone else present | — |

### D. Screen / process integrity
| Signal | How | Value | Evasion |
|---|---|---|---|
| **Tab/window focus loss** | Page Visibility API + `blur`/`focus` | Cheapest, most reliable cheating signal (alt-tabbing) | Second device (not on this machine) |
| Fullscreen enforcement | Fullscreen API + exit detection | Forces commitment; exit = event | Can be exited; warn/lock |
| Copy / paste / cut / right-click / print | DOM event interception | Stops paste-from-source; logs paste of AI text | Retype manually |
| **Clipboard read** (paste provenance) | `paste` event → was answer pasted vs typed? | **Gold for AI-cheat provenance** (see Step 3) | Manual retype defeats it (but slows them hugely) |
| Screen recording / screenshots | `getDisplayMedia` (Ext or prompt) — must pick **entire screen** | Full activity record; multi-window catch | Privacy-heavy; student picks wrong surface |
| **Multi-monitor detection** | Ext: window screen enumeration; `screen.isExtended` | Detects a second display for notes/AI | Pure web limited |
| DevTools open detection | Timing/debugger heuristics | Anti-tamper (student editing the page/JS) | Heuristic, evadable |
| Clipboard/keyboard shortcuts lockdown | Key interception (Ctrl/Cmd combos) | Block print, save, view-source | OS-level combos need Ext/Helper |

### E. Machine / network environment
| Signal | How | Value | Evasion |
|---|---|---|---|
| **VM detection** | Ext/Helper: GPU renderer string (WebGL `UNMASKED_RENDERER`), CPU/core heuristics, timing; Helper: CPU vendor, temp (100 °C VM default) | Catches "hide a 2nd AI session in a VM" — the #1 advanced tactic | QEMU w/ spoofed strings is hard to catch (HN-documented) |
| Remote-desktop / screen-mirroring detection | Ext/Helper: detect RDP/Teamviewer/Chromecast, refresh-rate/latency tells, `screen.isExtended` | Catches "someone drives my machine" | Sophisticated setups |
| Network/VPN/geo | Server-side IP intelligence, latency | Geo mismatch, datacenter IP = proxy | Residential proxies |
| Browser/extension integrity | Detect known cheat extensions, anti-proctor tools | Catches AI-answer extensions | Cat-and-mouse |
| Device fingerprint binding | Stable device ID bound to candidate | Detects exam taken on unexpected machine | Spoofable |

### F. Content / answer integrity (the underweighted frontier)
| Signal | How | Value | Evasion |
|---|---|---|---|
| Paste-vs-type ratio | Event analytics on each answer | High paste ratio on free-text = red flag | Retype |
| **Typing cadence vs content complexity** | Keystroke timeline vs answer sophistication | Fluent expert prose typed at uniform speed w/ no edits = authored elsewhere | Deliberate slow retype |
| Answer-construction replay | Record the *keystroke-level genesis* of each answer | **Reconstruct HOW the answer was written** — see Step 3 | — |
| Tab-switch ↔ paste correlation | Focus-loss event immediately precedes a paste | Strong AI-lookup signal | Second device |
| Response-time anomalies | Time-to-first-keystroke, total time vs difficulty | Too-fast perfect answers | — |
| Similarity / plagiarism | Cross-submission & web similarity (server) | Classic collusion/leak detection | Paraphrasing |
| AI-text classifier | LLM-text detector | **LOW VALUE — proven unreliable (see §6); use only as weak prior, never as proof** | Trivial |

---

## 5. What the browser canNOT do (and how we recover it)

Pure web is sandboxed. Honest limits, and our recovery path:

| Want | Pure web? | Recovery |
|---|---|---|
| Kill other apps / true kiosk | ❌ | Extension (block tabs/windows) or thin Tauri **Helper**; or SEB-handoff for ultra-high-stakes |
| Read other windows/processes | ❌ | Helper (enumerate processes) — opt-in, disclosed |
| Reliable VM/RDP detection | ⚠️ partial | WebGL/timing heuristics in web; robust in Helper |
| Capture full screen incl. other apps | ⚠️ user must consent & choose | `getDisplayMedia`; Extension can constrain |
| Multi-monitor truth | ⚠️ `screen.isExtended` only | Extension/Helper enumerate displays |
| Prevent uninstall/disable mid-exam | ❌ for web/ext | Helper or SEB-handoff |

**Strategic stance:** offer a **graduated trust ladder** — Web-only (max reach) → +Extension
(most institutions) → +Helper (high-stakes) → SEB/native handoff (ultra-high-stakes). Same exam,
same dashboard, buyer picks the rung. This is how we "stay in the browser" yet still serve the
high-stakes buyer without building a native browser ourselves.

---

## 6. Research-paper findings (what's proven, what's myth)

- **AI-text detection has collapsed.** OpenAI shut down its AI-text classifier (2025); Turnitin
  states its detector must not be the sole basis for an integrity finding (it admits ~false
  positives, esp. for non-native English writers). **Conclusion: never accuse on "this is
  AI-written." Build provenance instead** (capture *how* the answer was produced).
- **Multimodal > unimodal.** Combining gaze + head-pose + face + audio + behavior beats any single
  signal; reported systems hit ~85–90% accuracy / AUC ~0.88 (CNN-BiLSTM over webcam+audio;
  L2CS-Net gaze, SixDRepNet head-pose, Silero VAD, YOLO faces). Implication: a **fusion/scoring
  layer** that weights many weak signals is the right architecture, not any one detector.
- **Behavior analytics for AI-assisted cheating** (arXiv 2510.18881, 2025): the credible path to
  catching ChatGPT use is **behavioral/process telemetry** (focus loss, paste bursts, response
  timing, typing anomalies), not content classification. Directly validates our Step-3 direction.
- **Keystroke dynamics** is a mature, low-friction, camera-free **continuous-authentication**
  method (no special hardware; reduces test anxiety vs camera). Strong complement to face.
- **Eye-gaze cheating detection** in browser exams is feasible with webcam-only gaze estimation,
  but single-frame gaze flags produce false positives → must aggregate over time & context.
- **Bias is measured, not anecdotal** (Frontiers in Education 2022): documented **racial, skin-tone
  and sex disparities** in automated proctoring face/recognition. Implication: any face step must
  be **bias-audited, lighting-robust, and never auto-fail** — human review on low confidence.
- **Vulnerability/bias audit** (arXiv 2205.03009 "Watching the Watchers"): proctoring software is
  itself attackable and biased. Our extension/Helper must be **security-reviewed** (recall the
  Proctorio UXSS) — the proctor must not become the exploit.

---

## 7. Synthesized weakness list (the bill of grievances we will counter in Step 2/3)

1. **Privacy invasion / surveillance dread** — recording room, face, screen; stored in the cloud.
2. **Bias** — face recognition fails dark-skinned students; gaze flags neurodivergent students.
3. **False positives → false accusations** — automation flags innocents; appeals, anxiety, distrust.
4. **Evadable** — second device, VM, screen-mirror, proxy test-taker, QEMU; the camera can't see
   the phone in the lap.
5. **AI cheating unsolved** — content detectors don't work; ChatGPT-on-phone beats camera proctoring.
6. **Install/UX friction** — native browsers and heavy extensions generate support load & dropout.
7. **Security of the proctor itself** — high-privilege extensions are attack surface (UXSS precedent).
8. **Data-breach risk & liability** — storing biometric video of minors/students is a target & a
   regulatory landmine (GDPR/BIPA/biometric laws).
9. **Bolt-on, not integrated** — proctoring divorced from the assessment engine = clunky workflows.
10. **Cloud/bandwidth dependence** — streaming video fails on poor networks; excludes the
    low-bandwidth world; can't serve air-gapped labs.
11. **Cost of live proctoring** — humans don't scale to free/low-stakes quizzes.
12. **No real "proof"** — a flag is an accusation, not evidence; institutions fear due-process
    challenges.

---

## 8. Repos to physically clone for Step 2 build-prep (ready to pull on go)
1. `vardanagarwal/Proctoring-AI` — technique reference (head pose, gaze, YOLO objects, audio).
2. `kamlendras/OpenProctor` (Next.js/TS) — evaluate as frontend skeleton.
3. `rajrajhans/examsecure` — browser-side detection architecture reference.
4. AutoOEP paper code (ArcFace multimodal) — fusion-layer & identity reference (aligns with our engine).

---

## Sources
- https://www.gartner.com/reviews/market/remote-proctoring-in-education
- https://thinkexam.com/blog/proctoring-tool-comparison-which-plug-ins-browser-extensions-apis-are-worth-it-in-2025/
- https://honorlock.com/blog/how-to-stop-chatgpt-with-online-proctoring-software/
- https://honorlock.com/blog/proctoring-cell-phone-detection-new/
- https://honorlock.com/blog/stop-contract-cheating/
- https://www.forasoft.com/blog/article/online-proctoring-anti-cheating-2026
- https://safeexambrowser.org/about_overview_en.html
- https://safeexambrowser.org/windows/win_usermanual_en.html
- https://proctorio.com/about/blog/why-proctorio-requests-certain-browser-permissions
- https://sector7.computest.nl/post/2021-12-proctorio/ (Proctorio extension UXSS)
- https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- https://www.shadecoder.com/blogs/tab-switch-detector-online-2026-how-it-works-what-gets-you-flagged-how-exams-track-you
- https://news.ycombinator.com/item?id=29163258 (VM detection / QEMU evasion)
- https://www.imsglobal.org/spec/lti/v1p3/impl-assess (LTI 1.3 assessment)
- https://arxiv.org/html/2509.10887v1 (AutoOEP multimodal, ArcFace)
- https://arxiv.org/pdf/2510.18881 (AI-assisted cheating via behavior analytics)
- https://arxiv.org/pdf/2205.03009 (Watching the Watchers: bias & vulnerability)
- https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2022.881449/full (skin-tone/sex disparities)
- https://blog.typingdna.com/proctoring-and-student-identity-validation-with-keystroke-dynamics/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9707207/ (keystroke dynamics in exams)
- https://www.eff.org/deeplinks/2020/09/students-are-pushing-back-against-proctoring-surveillance-apps
- https://www.technologyreview.com/2020/08/07/1006132/software-algorithms-proctoring-online-tests-ai-ethics/
- https://www.csmonitor.com/Technology/2020/1117/Online-exams-raise-concerns-of-racial-bias-in-facial-recognition
- https://github.com/vardanagarwal/Proctoring-AI
- https://github.com/rajrajhans/examsecure
- https://github.com/aungkhantmyat/The-Online-Exam-Proctor
- https://github.com/kamlendras/OpenProctor
