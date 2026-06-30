import { useEffect, useRef, useState } from 'react';
import { createFaceAnalyzer, type FaceAnalyzer } from '../vision/mediapipeFace';

type Status = 'starting' | 'on' | 'unsupported' | 'error';

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
  onIdentityFrame,
  intervalMs = 1500,
  identityIntervalMs = 30_000,
}: {
  onFaceCount: (count: number) => void;
  /** Whether the primary face is oriented toward the screen this frame. */
  onGaze?: (onScreen: boolean) => void;
  /** Periodically receives a captured frame (data URL) for continuous identity. */
  onIdentityFrame?: (image: string) => void;
  intervalMs?: number;
  identityIntervalMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onGazeRef = useRef(onGaze);
  onGazeRef.current = onGaze;
  const onIdentityRef = useRef(onIdentityFrame);
  onIdentityRef.current = onIdentityFrame;
  const [status, setStatus] = useState<Status>('starting');

  useEffect(() => {
    let stream: MediaStream | undefined;
    let analyzer: FaceAnalyzer | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let identityTimer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        analyzer = await createFaceAnalyzer();
        if (stopped) return;
        setStatus('on');
        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || !analyzer) return;
          try {
            const { count, gazeOnScreen } = analyzer.analyze(video, performance.now());
            onFaceCount(count);
            onGazeRef.current?.(gazeOnScreen);
          } catch {
            /* transient detector errors are non-fatal */
          }
        }, intervalMs);
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
      if (identityTimer) clearInterval(identityTimer);
      analyzer?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onFaceCount, intervalMs, identityIntervalMs]);

  return (
    <div className="webcam">
      <video ref={videoRef} muted playsInline width={160} height={120} />
      <span className="webcam-status">camera: {status}</span>
      <span className="webcam-hint">Keep your whole face in view.</span>
    </div>
  );
}
