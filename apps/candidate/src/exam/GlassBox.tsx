import type { IntegritySummary } from './session';

/**
 * Glass-box transparency panel. Every competitor is a black box that breeds
 * dread; PIE shows the candidate exactly what is and isn't being captured, in
 * real time. Because inference is on-device, "no footage stored" is the truth.
 */
export function GlassBox({ summary }: { summary: IntegritySummary }) {
  return (
    <aside className="glassbox" aria-label="What PIE is monitoring">
      <h2>What we see</h2>
      <ul>
        <li>
          <span>Identity</span>
          {summary.lastIdentityMatch === null ? (
            <strong className="muted">not yet checked</strong>
          ) : summary.lastIdentityMatch ? (
            <strong className="ok">verified ✓ ({summary.identityChecks})</strong>
          ) : (
            <strong className="warn">mismatch ✗</strong>
          )}
        </li>
        <li>
          <span>Face on camera</span>
          {summary.facePresence === null ? (
            <strong className="muted">camera off</strong>
          ) : summary.facePresence === 'present' ? (
            <strong className="ok">present ✓</strong>
          ) : summary.facePresence === 'absent' ? (
            <strong className="warn">no face</strong>
          ) : (
            <strong className="warn">multiple faces</strong>
          )}
        </li>
        {summary.facePresence === 'present' && (
          <li>
            <span>Gaze</span>
            <strong className={summary.gazeOffScreen ? 'warn' : 'ok'}>
              {summary.gazeOffScreen ? 'looking away' : 'on screen ✓'}
            </strong>
          </li>
        )}
        {summary.voiceActive !== null && (
          <li>
            <span>Microphone</span>
            <strong className={summary.voiceActive ? 'warn' : 'ok'}>
              {summary.voiceActive ? 'voice detected' : 'quiet ✓'}
            </strong>
          </li>
        )}
        <li>
          <span>Left exam surface</span>
          <strong className={summary.focusLossCount > 0 ? 'warn' : 'ok'}>
            {summary.focusLossCount} time{summary.focusLossCount === 1 ? '' : 's'}
          </strong>
        </li>
        <li>
          <span>Integrity events</span>
          <strong>{summary.eventCount}</strong>
        </li>
        <li>
          <span>Video / screen footage stored</span>
          <strong className="ok">{summary.footageStored ? 'yes' : 'none'}</strong>
        </li>
      </ul>
      <p className="glassbox-note">
        Provenance is recorded on this device. We certify your authorship — we do not record you.
      </p>
    </aside>
  );
}
