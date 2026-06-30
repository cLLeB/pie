# Integrity Core Implementation Plan (Sub-Project 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the framework-agnostic TypeScript "Integrity Core" — a tamper-evident, hash-chained
event ledger plus the first sensor + answer-provenance modules — that is the foundation of every
other subsystem and the engine behind the "Proof-of-Authorship" Authenticity Certificate.

**Architecture:** A pure-logic TS package (`packages/integrity-core`) with no DOM/network/model
dependencies in its core, so it runs identically in a browser, a worker, or Node tests. A `Ledger`
hash-chains typed `IntegrityEvent`s (each event hashes the previous → tampering is detectable). A
`Sensor` interface lets independent monitoring modules emit events into a ledger. A `Provenance`
module models the keystroke-level genesis of an answer (insert/delete/paste ops) and can replay it.
An `AuthenticityBundle` assembler exports the chain + summary for later server-side signing.

**Tech Stack:** TypeScript 5, Vitest (tests), `@noble/hashes` (audited, synchronous SHA-256 that
works in both browser and Node). npm workspaces monorepo. No framework yet (the React candidate app
is a later sub-project that consumes this package).

## Global Constraints

- Node ≥ 20 (we have v22.15.0). Package is ESM (`"type": "module"`).
- Core (`src/`, excluding `src/sensors/*` DOM bridges) MUST NOT import DOM globals or do I/O — it
  must run in plain Node with no jsdom. Sensors isolate all DOM access behind an injected event
  source so they are testable without a browser.
- Immutability: ledger append returns a new event; never mutate prior events (matches house style).
- All hashing is SHA-256, hex-encoded, over a canonical (stable-key-order) JSON serialization.
- TDD: every behavior gets a failing test first. Frequent commits (one per task).

---

## File Structure

```
packages/integrity-core/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                 # public exports
    hash.ts                  # sha256Hex(), canonicalize()
    events.ts                # IntegrityEvent type, EventType union
    ledger.ts                # Ledger: append/root/export/verify
    provenance/
      ops.ts                 # EditOp type, applyOp(), applyAll()
      metrics.ts             # provenanceMetrics(): typed vs pasted, ratios, timing
      replay.ts              # textAtStep(): reconstruct answer at any op index
      recorder.ts            # ProvenanceRecorder: DOM InputEvent -> EditOp[] (DOM bridge)
    sensors/
      sensor.ts              # Sensor interface, EventSink type
      visibility.ts          # VisibilitySensor: focus/blur/visibility -> events (DOM bridge)
    bundle.ts                # AuthenticityBundle assembler (export + summary)
  tests/
    hash.test.ts
    ledger.test.ts
    provenance-ops.test.ts
    provenance-metrics.test.ts
    provenance-replay.test.ts
    visibility-sensor.test.ts
    recorder.test.ts
    bundle.test.ts
```

---

### Task 0: Repo + workspace scaffold

**Files:**
- Create: `.gitignore`, `package.json` (root, workspaces), `packages/integrity-core/package.json`,
  `packages/integrity-core/tsconfig.json`, `packages/integrity-core/vitest.config.ts`,
  `packages/integrity-core/src/index.ts`, `packages/integrity-core/tests/smoke.test.ts`

**Interfaces:**
- Produces: a working `npm test -w @protractor/integrity-core` that runs Vitest.

- [ ] Step 1: `git init`; write root `package.json` with `"workspaces": ["packages/*"]` and a
  `test` script; write `.gitignore` (node_modules, dist, coverage).
- [ ] Step 2: Write `packages/integrity-core/package.json` (ESM, deps: `@noble/hashes`; devDeps:
  `typescript`, `vitest`), `tsconfig.json` (strict, moduleResolution bundler), `vitest.config.ts`.
- [ ] Step 3: Write a trivial `tests/smoke.test.ts` asserting `1+1===2`; run `npm install`.
- [ ] Step 4: Run `npm test`; expect the smoke test to PASS.
- [ ] Step 5: Commit `chore: scaffold integrity-core workspace`.

---

### Task 1: Hashing + canonical serialization

**Files:** Create `src/hash.ts`, `tests/hash.test.ts`.

**Interfaces:**
- Produces: `canonicalize(value: unknown): string` (deterministic JSON, keys sorted recursively);
  `sha256Hex(input: string): string` (hex SHA-256 via `@noble/hashes/sha256` + `bytesToHex`).

- [ ] Step 1: Write failing tests: `canonicalize({b:1,a:2}) === canonicalize({a:2,b:1})`;
  `sha256Hex("abc")` equals the known vector
  `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
- [ ] Step 2: Run tests → FAIL (module not found).
- [ ] Step 3: Implement `canonicalize` (recursive key-sort, arrays preserved) and `sha256Hex`.
- [ ] Step 4: Run tests → PASS.
- [ ] Step 5: Commit `feat: sha256 + canonical serialization`.

---

### Task 2: IntegrityEvent + hash-chained Ledger

**Files:** Create `src/events.ts`, `src/ledger.ts`, `tests/ledger.test.ts`.

**Interfaces:**
- Consumes: `sha256Hex`, `canonicalize` from `hash.ts`.
- Produces:
  - `type IntegrityEvent = { seq:number; ts:number; type:string; data:Record<string,unknown>;
    prevHash:string; hash:string }`
  - `class Ledger { constructor(opts?:{genesis?:string; now?:()=>number});
    append(type:string, data?:Record<string,unknown>, ts?:number): IntegrityEvent;
    root(): string; export(): IntegrityEvent[]; }`
  - `function verifyChain(events: IntegrityEvent[], genesis?: string): { ok:boolean; brokenAt?:number }`
  - `hash = sha256Hex(canonicalize({seq,ts,type,data,prevHash}))`; genesis default `"GENESIS"`.

- [ ] Step 1: Write failing tests: appended events have increasing `seq` from 0; `event0.prevHash`
  === genesis; `event1.prevHash` === `event0.hash`; `verifyChain(ledger.export())` → `{ok:true}`;
  mutating `events[1].data` then `verifyChain` → `{ok:false, brokenAt:1}`; injected `now` controls `ts`.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `events.ts` (type only) and `ledger.ts` (append computes prevHash/hash;
  export returns a copy; verifyChain recomputes each hash and checks links).
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: tamper-evident hash-chained ledger`.

---

### Task 3: Provenance edit-ops model

**Files:** Create `src/provenance/ops.ts`, `tests/provenance-ops.test.ts`.

**Interfaces:**
- Produces:
  - `type EditOp = { t:number; kind:'insert'|'delete'|'paste'; pos:number; text?:string; len?:number }`
  - `function applyOp(doc:string, op:EditOp): string` (insert/paste insert `text` at `pos`; delete
    removes `len` chars at `pos`).
  - `function applyAll(ops:EditOp[], doc?:string): string`.

- [ ] Step 1: Write failing tests: insert "hi" at 0 on "" → "hi"; paste "X" at 1 on "ab" → "aXb";
  delete len 1 at 0 on "ab" → "b"; `applyAll([...])` reconstructs a known final string.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `applyOp`/`applyAll` (pure string splicing; immutable).
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: provenance edit-op model`.

---

### Task 4: Provenance metrics (the authorship signal)

**Files:** Create `src/provenance/metrics.ts`, `tests/provenance-metrics.test.ts`.

**Interfaces:**
- Consumes: `EditOp` from `ops.ts`.
- Produces: `function provenanceMetrics(ops:EditOp[]): { typedChars:number; pastedChars:number;
  pasteCount:number; pasteRatio:number; durationMs:number; opCount:number }`
  (`pasteRatio = pastedChars/(typedChars+pastedChars)`, 0 when empty; durationMs = lastT-firstT).

- [ ] Step 1: Write failing tests: all single-char inserts → pasteRatio 0, pasteCount 0; one paste
  of "hello" + 0 typed → pasteRatio 1, pasteCount 1, pastedChars 5; mixed → correct ratio;
  durationMs from timestamps; empty ops → all zeros, ratio 0.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `provenanceMetrics`.
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: provenance authorship metrics`.

---

### Task 5: Provenance replay

**Files:** Create `src/provenance/replay.ts`, `tests/provenance-replay.test.ts`.

**Interfaces:**
- Consumes: `EditOp`, `applyAll`.
- Produces: `function textAtStep(ops:EditOp[], step:number): string` (state after first `step` ops;
  step 0 → ""; step ≥ len → final).

- [ ] Step 1: Write failing tests: textAtStep(ops,0)===""; textAtStep at an intermediate index
  matches expected partial; textAtStep(ops, ops.length) === final.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `textAtStep` (slice + applyAll).
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: provenance replay`.

---

### Task 6: Sensor interface + VisibilitySensor (DOM bridge, injectable source)

**Files:** Create `src/sensors/sensor.ts`, `src/sensors/visibility.ts`, `tests/visibility-sensor.test.ts`.

**Interfaces:**
- Consumes: `Ledger` (as the sink).
- Produces:
  - `type EventSink = (type:string, data?:Record<string,unknown>)=>void`
  - `interface Sensor { start():void; stop():void }`
  - `interface VisibilitySource { addEventListener(type:string, cb:()=>void):void;
    removeEventListener(type:string, cb:()=>void):void; hidden:()=>boolean }`
  - `class VisibilitySensor implements Sensor { constructor(sink:EventSink, source:VisibilitySource) }`
    — emits `focus.lost`/`focus.gained` on blur/focus and `visibility.hidden`/`visibility.visible`.

- [ ] Step 1: Write failing test using a fake `VisibilitySource`: firing "blur" calls sink with
  `focus.lost`; "focus" → `focus.gained`; "visibilitychange" with hidden()→true emits
  `visibility.hidden`; `stop()` detaches (no further events). Use a `Ledger` as the real sink and
  assert events land in `export()`.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `sensor.ts` + `visibility.ts`.
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: sensor interface + visibility sensor`.

---

### Task 7: ProvenanceRecorder (InputEvent → EditOp[] bridge)

**Files:** Create `src/provenance/recorder.ts`, `tests/recorder.test.ts`.

**Interfaces:**
- Consumes: `EditOp`.
- Produces: `class ProvenanceRecorder { constructor(now?:()=>number);
  onInput(e:{inputType:string; data:string|null; selectionStart:number}): void; ops():EditOp[] }`
  — maps `insertText`→insert(1 char), `insertFromPaste`→paste(text), `deleteContentBackward`→delete.

- [ ] Step 1: Write failing tests: feeding a sequence of synthetic input events yields the expected
  `EditOp[]`; a paste event yields kind 'paste' with the pasted text; metrics over the result give
  the expected pasteRatio.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `recorder.ts`.
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat: provenance recorder (input-event bridge)`.

---

### Task 8: AuthenticityBundle assembler + integration test

**Files:** Create `src/bundle.ts`, `src/index.ts` (exports), `tests/bundle.test.ts`.

**Interfaces:**
- Consumes: `Ledger`, `verifyChain`, `provenanceMetrics`, `EditOp`.
- Produces: `function buildAuthenticityBundle(input:{ ledger:Ledger;
  answers: { id:string; ops:EditOp[] }[] }): { root:string; events:IntegrityEvent[];
  answers:{ id:string; metrics:ReturnType<typeof provenanceMetrics> }[]; verified:boolean }`.

- [ ] Step 1: Write failing integration test: build a session (visibility events + two answers, one
  typed one pasted), assemble the bundle, assert `verified===true`, `root===ledger.root()`, and the
  pasted answer's `pasteRatio===1` while the typed one's is `0`.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement `bundle.ts` and wire all public exports in `index.ts`.
- [ ] Step 4: Run full suite `npm test` → ALL PASS.
- [ ] Step 5: Commit `feat: authenticity bundle assembler + integration`.

---

## Self-Review notes
- Spec coverage: implements Step-3 provenance + tamper-evident ledger (the sauce foundation) and the
  Step-2 modular sensor mesh interface. Identity (biometric `/v1`), vision/audio models, the React
  app, server, and LTI are explicitly later sub-projects — not in this plan's scope.
- The signing of the bundle root is left as a clean seam (`root` is exported) for the server sub-
  project, which already has HMAC signing in the biometric engine. No placeholder logic in code.
- Type consistency: `EventSink`, `IntegrityEvent`, `EditOp`, `Ledger` names are used identically
  across tasks.
