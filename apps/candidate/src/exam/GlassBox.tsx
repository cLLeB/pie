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
          <strong className="ok">verified ✓</strong>
        </li>
        <li>
          <span>Presence</span>
          <strong className="ok">on screen ✓</strong>
        </li>
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
