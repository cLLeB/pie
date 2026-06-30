# Step 3 — The Sauce: Proof-of-Authorship

> The thing that makes ours *known* — different, valuable, and absent from the market.
> One core idea, three supporting pillars. It falls directly out of the Step-1 finding that
> **AI-text detection is dead** and the only credible path is **provenance**.

---

## The inversion

Every competitor sells the same thing: **suspicion**. They watch the student (camera, mic, screen),
run ML, and emit *flags* — "this person looked away," "this might be AI." That posture creates all
their problems: it's creepy, biased, evadable, and a flag is an accusation, not proof.

**We sell the opposite: proof.** We don't try to catch the student doing something wrong. We
**certify that the work is authentically theirs** — produced by the verified person, by their own
hand, in one continuous sitting. The output of an exam isn't a pile of suspicion scores; it's a
**verifiable Authenticity Certificate** attached to every answer.

> **"We don't watch students. We certify their work."**

This is a category change: from *proctoring* (surveillance) to **authorship verification**
(notarization). It's positive-framed (the student is being vouched for, not policed), it's the
real answer to AI cheating (you can't detect AI text, but you *can* prove a human authored this
one), and it turns our owned biometric engine from a "face-check feature" into the heart of a
**signed identity-and-authorship ledger**.

---

## Pillar 1 — The Authenticity Certificate (the core artifact)

Every submission carries a portable, cryptographically **signed, tamper-evident certificate** that
binds three facts into one record:

- **WHO** — continuous biometric identity from our `contactless-fingerprint-system` `/v1` engine:
  not just "logged in," but "the *same enrolled human* was present and verified throughout,"
  sampled across the session, with liveness. (Face or palm; keystroke biometric as camera-free
  fallback/accommodation.)
- **HOW** — the **authorship provenance** of each answer: it was typed character-by-character over
  N minutes with natural edits and pauses — *not* pasted in 2 seconds, *not* preceded by a
  tab-switch, *not* typed at a uniform machine cadence.
- **WHEN/WHERE** — a hash-chained timeline of integrity events (focus, environment, identity
  samples) that **cannot be altered after the fact** (each event hashes the previous → a Merkle
  chain; the engine already HMAC-signs results, so we extend that to sign the chain root).

The certificate is **independently verifiable** — like an SSL certificate for an exam answer, or a
notary stamp. In an academic-integrity appeal, the institution doesn't wave a vague "suspicion
score"; it presents a signed record that holds up to due process. That directly kills weakness #12
("no real proof") and defuses #3 (false accusations) — because we're not accusing, we're attesting.

## Pillar 2 — Authorship Replay (the evidence everyone can see)

From the keystroke-genesis log we can **replay the writing of any answer** — like a screen
recording, but reconstructed from a few kilobytes of timing data, not gigabytes of video. An
instructor watches the essay *come into being*: the false starts, the rephrasings, the thinking.
A human-authored answer looks alive; an answer pasted from ChatGPT appears fully-formed in one
event. This is far more convincing — and far cheaper to store and stream — than camera footage,
and it works on terrible networks and offline.

Crucially it's **transparent both ways**: the student can replay their own record. That builds
trust instead of dread (see Pillar 3).

## Pillar 3 — Glass-Box Proctoring (trust as a feature)

Every competitor is a **black box** that breeds anxiety — students don't know what's recorded or
what flagged them. We invert it: a live, honest **"what we see" panel** shows the candidate in
real time exactly what's being captured and what *isn't* — e.g. *"Identity: verified ✓ · Presence:
ok ✓ · Footage stored: none · Keystroke provenance: recording."* Because inference runs **on-device
by default** (Step-2 commitment C1), we can truthfully say "no video is leaving your machine," and
prove it. Transparency is only possible *because* of the privacy-first architecture — the sauce and
the structure reinforce each other.

This is the antidote to the entire backlash (weaknesses #1, #2): a student who can *see* that no
footage is stored and that the system is certifying (not hunting) is a student who isn't terrified
or alienated — and an institution that isn't a headline.

---

## Why this is genuinely not on the market
- Commercial players are architecturally committed to **cloud video surveillance**; "flags, not
  footage" + glass-box would invalidate their own products and data models.
- The market is still chasing **AI-text detection** (a dead end). Provenance-of-authorship sidesteps
  it entirely — and is *strengthened* by AI getting better, because better AI makes the *process*
  (instant paste vs. lived typing) the only reliable tell.
- Nobody binds **owned continuous biometric identity + keystroke provenance + a tamper-evident
  signed ledger** into a single portable certificate. We can, because we already own the identity
  engine — competitors license a face SDK and couldn't issue a trustworthy combined attestation.

## Why it's browser-feasible (no native app needed)
- Keystroke genesis: `keydown`/`keyup` + `performance.now()` + `paste`/`input` events → a tiny
  per-answer event log. Trivial in any browser.
- Continuous identity: periodic frame → our `/v1/verify` (or on-device `/embed`+compare). Already
  built.
- Tamper-evidence: hash-chain events client-side, sign the root server-side (engine has HMAC).
- Replay & glass-box: pure front-end from the event log. Tiny data; offline-friendly.

## The "...and more" — why it makes us *known*
- **Portable, verifiable badge.** A certificate can ride along with *any* submission — a take-home
  essay, a coding assignment, a professional-CE module, a job-application skills test — as a
  **"Verified authorship by [Brand]"** mark anyone can check. That's a brandable, network-effect
  trust mark beyond the exam room. Integrity becomes a *credential the student can carry*, not a
  surveillance tax they endure.
- **Free-quiz integrity.** A featherlight mode (keystroke + identity provenance, **zero camera**,
  instant certificate) makes authenticity viable for *free, low-stakes quizzes* where camera
  proctoring is absurd and unaffordable — opening a market the incumbents can't serve.
- **It compounds with the owned engine.** Every exam strengthens the biometric enrollment (the
  engine has adaptive enrolment), so identity gets *more* reliable over a student's career — and
  the face/palm dual-modality gives a built-in accommodation story competitors lack.

---

## One-line pitch
**Proof-of-Authorship: instead of surveilling students and guessing, we issue a signed,
replayable, privacy-first certificate that the verified person authored this work themselves —
the trustworthy answer to AI-era cheating, and a credential students are glad to carry.**

## Risks & honest counters
- *"Determined cheater retypes ChatGPT output by hand."* — They can; but it's slow, the cadence/edit
  signature of transcription differs from composition, and identity + environment signals still
  apply. We raise the cost enormously and keep the multi-signal net. No system is perfect; ours is
  *defensible and humane*, which is the winning trade.
- *"Keystroke provenance needs typed answers."* — True; for MCQ-heavy/quizzes the certificate leans
  on identity + timing + selection provenance instead. Modes adapt to item type.
- *"Is the certificate legally meaningful?"* — It's evidence, framed as attestation with confidence,
  designed for due process — strictly better than today's opaque suspicion scores.
