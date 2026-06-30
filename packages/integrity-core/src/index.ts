// @pie/integrity-core — public API surface.
//
// PIE's tamper-evident integrity ledger, modular sensor mesh, and answer-
// provenance engine: the foundation of the "Proof-of-Authorship" certificate.

export const INTEGRITY_CORE_VERSION = '0.0.1';

export { canonicalize, sha256Hex } from './hash.js';
export type { IntegrityEvent } from './events.js';
export { Ledger, verifyChain } from './ledger.js';
export type { LedgerOptions, VerifyResult } from './ledger.js';

export { applyOp, applyAll } from './provenance/ops.js';
export type { EditOp } from './provenance/ops.js';
export { provenanceMetrics } from './provenance/metrics.js';
export type { ProvenanceMetrics } from './provenance/metrics.js';
export { textAtStep } from './provenance/replay.js';
export { ProvenanceRecorder } from './provenance/recorder.js';
export type { InputEventLike } from './provenance/recorder.js';

export type { Sensor, EventSink } from './sensors/sensor.js';
export { VisibilitySensor } from './sensors/visibility.js';
export type { VisibilitySource } from './sensors/visibility.js';
export { FullscreenSensor } from './sensors/fullscreen.js';
export type { FullscreenSource } from './sensors/fullscreen.js';
export { SensorMesh } from './sensors/mesh.js';

export { buildAuthenticityBundle } from './bundle.js';
export type { AuthenticityBundle, AnswerProvenance, AnswerSummary } from './bundle.js';

export { signCertificate, verifyCertificate, hmacHex } from './signing.js';
export type { SignedCertificate } from './signing.js';

export { verifySignedBundle } from './verify.js';
export type { SignedBundleVerification } from './verify.js';
