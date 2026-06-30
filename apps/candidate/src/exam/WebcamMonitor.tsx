import { useEffect, useRef, useState } from 'react';
import { createFaceAnalyzer, type FaceAnalyzer } from '../vision/mediapipeFace';
import { rms } from '../audio/level';

type Status = 'starting' | 'on' | 'unsupported' | 'error';

// Amplitude that counts as voice. Brief coughs/clicks are rejected by the 1s
// sustain requirement (in AudioActivitySensor), so this can stay sensitive enough
// for normal, slightly-distant speech.
const VOICE_THRESHOLD = 0.02;

/**
 * Runs the webcam + on-device face detector and reports the live face count. The
 * video stays on the device; only the count (a number) flows into the integrity
 * ledger. Mounted only when the candidate enables the camera, so it never runs in
 * tests or before consent.
 */
function captureFrame(video: HTMLVideoElement): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

export function WebcamMonitor({
  onFaceCount,
  onGaze,
  onAudio,
  onIdentityFrame,
  intervalMs = 1500,
  audioIntervalMs = 250,
  identityIntervalMs = 30_000,
}: {
  onFaceCount: (count: number) => void;
  /** Whether the primary face is oriented toward the screen this frame. */
  onGaze?: (onScreen: boolean) => void;
  /** Whether voice is detected this tick (microphone). */
  onAudio?: (isVoice: boolean) => void;
  /** Periodically receives a captured frame (data URL) for continuous identity. */
  onIdentityFrame?: (image: string) => void;
  intervalMs?: number;
  audioIntervalMs?: number;
  identityIntervalMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onGazeRef = useRef(onGaze);
  onGazeRef.current = onGaze;
  const onAudioRef = useRef(onAudio);
  onAudioRef.current = onAudio;
  const onIdentityRef = useRef(onIdentityFrame);
  onIdentityRef.current = onIdentityFrame;
  const [status, setStatus] = useState<Status>('starting');
  const [debug, setDebug] = useState({
    faces: 0,
    yaw: null as number | null,
    pitch: null as number | null,
    eye: 0,
    rms: 0,
  });

  useEffect(() => {
    let stream: MediaStream | undefined;
    let analyzer: FaceAnalyzer | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let audioTimer: ReturnType<typeof setInterval> | undefined;
    let identityTimer: ReturnType<typeof setInterval> | undefined;
    let audioCtx: AudioContext | undefined;
    let audioData: Float32Array<ArrayBuffer> | undefined;
    let analyserNode: AnalyserNode | undefined;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // Set up on-device audio level analysis (no audio is recorded).
        if (stream.getAudioTracks().length > 0) {
          audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 1024;
          audioData = new Float32Array(analyserNode.fftSize);
          source.connect(analyserNode);
        }
        analyzer = await createFaceAnalyzer();
        if (stopped) return;
        setStatus('on');
        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || !analyzer) return;
          try {
            const { count, gazeOnScreen, pose, eyeAway } = analyzer.analyze(
              video,
              performance.now(),
            );
            onFaceCount(count);
            // Only feed gaze when a face is tracked; absence is reported by presence.
            if (count > 0) onGazeRef.current?.(gazeOnScreen);
            setDebug((d) => ({
              ...d,
              faces: count,
              yaw: pose ? pose.yaw : null,
              pitch: pose ? pose.pitch : null,
              eye: eyeAway,
            }));
          } catch {
            /* transient detector errors are non-fatal */
          }
        }, intervalMs);
        // Audio is sampled far more often than the vision tick so it actually
        // catches speech (which falls between words on a slow sampler).
        if (analyserNode && audioData) {
          audioTimer = setInterval(() => {
            if (!analyserNode || !audioData) return;
            analyserNode.getFloatTimeDomainData(audioData);
            const level = rms(audioData);
            onAudioRef.current?.(level > VOICE_THRESHOLD);
            setDebug((d) => ({ ...d, rms: level }));
          }, audioIntervalMs);
        }
        if (onIdentityRef.current) {
          identityTimer = setInterval(() => {
            const video = videoRef.current;
            if (!video || !onIdentityRef.current) return;
            const frame = captureFrame(video);
            if (frame) onIdentityRef.current(frame);
          }, identityIntervalMs);
        }
      } catch {
        setStatus('error');
      }
    }

    void start();
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      if (audioTimer) clearInterval(audioTimer);
      if (identityTimer) clearInterval(identityTimer);
      analyzer?.close();
      void audioCtx?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onFaceCount, intervalMs, audioIntervalMs, identityIntervalMs]);

  return (
    <div className="webcam">
      <video ref={videoRef} muted playsInline width={160} height={120} />
      <span className="webcam-status">camera: {status}</span>
      <span className="webcam-debug">
        f{debug.faces} · yaw {debug.yaw === null ? '–' : `${debug.yaw.toFixed(0)}°`} · pitch{' '}
        {debug.pitch === null ? '–' : `${debug.pitch.toFixed(0)}°`} · eye {debug.eye.toFixed(2)} · mic{' '}
        {debug.rms.toFixed(3)}
        {debug.rms > VOICE_THRESHOLD ? ' 🔊' : ''}
      </span>
      <span className="webcam-hint">Keep your whole face in view. Audio level only — nothing is recorded.</span>
    </div>
  );
}
