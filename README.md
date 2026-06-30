# PIE — Platform for Intelligent Examinations

Browser-based exam proctoring built on a different premise than the rest of the market:
**we don't surveil students — we certify their work.**

Incumbent proctoring sells *suspicion* (record camera/mic/screen → ML → flags), which makes it
creepy, biased, evadable, and bandwidth-hungry — and it still can't catch AI cheating now that
AI-text detection has collapsed. PIE inverts this with **Proof-of-Authorship**: every answer carries
a signed, tamper-evident **Authenticity Certificate** binding **WHO** (continuous biometric identity),
**HOW** (keystroke-genesis provenance, replayable), and **WHEN** (a hash-chained event ledger that
can't be altered). Inference runs **on-device by default** ("flags, not footage"), so it's
privacy-first, cheap to run, and works offline.

> "We don't watch students. We certify their work."

## Why PIE can be free

On-device inference + events-not-footage + a CPU-only identity engine + self-hosting remove the three
costs that force incumbents to charge (live human proctors, cloud video storage, server GPU). The
marginal cost of a proctored exam in default mode is ~$0. Model: **open-core** — free, self-hostable
core + certificate; paid managed cloud, opt-in video tier, premium modules, and enterprise support.

## Resuming work?

Start with **[`docs/RESUME.md`](docs/RESUME.md)** — run commands, current status, the open
camera/mic calibration state, and the prioritized next steps. Build status: [`docs/STATUS.md`](docs/STATUS.md).

## Research & design

The full landscape teardown, architecture, the differentiator, and the cost model live in
[`docs/research/`](docs/research/):

- [`01-landscape-dossier.md`](docs/research/01-landscape-dossier.md) — competitor + open-source +
  research teardown, full catalog of browser-feasible monitoring signals, weakness list.
- [`02-architecture-and-stack.md`](docs/research/02-architecture-and-stack.md) — the four design
  commitments, modular sensor-mesh architecture, tech stack, opportunity-cost ledger.
- [`03-the-sauce.md`](docs/research/03-the-sauce.md) — Proof-of-Authorship.
- [`04-cost-and-free-path.md`](docs/research/04-cost-and-free-path.md) — free path + open-core model.

Implementation plans live in [`docs/superpowers/plans/`](docs/superpowers/plans/).

## Monorepo layout

```
packages/
  integrity-core/   @pie/integrity-core — tamper-evident ledger, sensor mesh,
                    answer-provenance engine (the Proof-of-Authorship core). ✅ built, 35 tests.
apps/               (candidate web app, review console — upcoming sub-projects)
```

The identity layer reuses an existing, separate project — a production multi-tenant face/palm
verification REST API (ArcFace + liveness, encrypted, offline-capable) — as PIE's continuous-identity
spine, rather than rebuilding it.

## Develop

```bash
npm install
npm test            # runs all workspace test suites
```

Requires Node ≥ 20. `@pie/integrity-core` is framework-agnostic TypeScript with no DOM/network
dependencies in its core, so it runs the same in a browser, a worker, or Node.

## Status

Early. Sub-Project 1 (Integrity Core) is implemented and tested. Next: the candidate web app (React
PWA exam runner wiring the sensor mesh), then identity integration, the review console, and LMS
(LTI 1.3 / QTI) connectors.
