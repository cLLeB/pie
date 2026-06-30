import { formatDuration } from './time';

const LOW_TIME_SECONDS = 60;

export function Timer({ remaining }: { remaining: number }) {
  return (
    <span
      className={`timer ${remaining <= LOW_TIME_SECONDS ? 'warn' : ''}`}
      aria-label="Time remaining"
    >
      ⏱ {formatDuration(remaining)}
    </span>
  );
}
