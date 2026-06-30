/**
 * Root-mean-square amplitude of a time-domain audio buffer (values in -1..1).
 * RMS is a stable measure of loudness for a short window — higher means louder.
 */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return Math.sqrt(sum / samples.length);
}

/** Whether a window's loudness suggests speech (above a small threshold). */
export function isVoiceLevel(samples: Float32Array, threshold = 0.035): boolean {
  return rms(samples) > threshold;
}
