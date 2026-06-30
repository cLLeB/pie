import { useEffect, useRef, useState } from 'react';
import { createFaceCounter, type FaceCounter } from '../vision/mediapipeFace';

type Status = 'starting' | 'on' | 'unsupported' | 'error';

/**
 * Runs the webcam + on-device face detector and reports the live face count. The
 * video stays on the device; only the count (a number) flows into the integrity
 * ledger. Mounted only when the candidate enables the camera, so it never runs in
 * tests or before consent.
 */
export function WebcamMonitor({
  onFaceCount,
  intervalMs = 1500,
}: {
  onFaceCount: (count: number) => void;
  intervalMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('starting');

  useEffect(() => {
    let stream: MediaStream | undefined;
    let counter: FaceCounter | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
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
        counter = await createFaceCounter();
        if (stopped) return;
        setStatus('on');
        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || !counter) return;
          try {
            onFaceCount(counter.detect(video, performance.now()));
          } catch {
            /* transient detector errors are non-fatal */
          }
        }, intervalMs);
      } catch {
        setStatus('error');
      }
    }

    void start();
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      counter?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onFaceCount, intervalMs]);

  return (
    <div className="webcam">
      <video ref={videoRef} muted playsInline width={160} height={120} />
      <span className="webcam-status">camera: {status}</span>
    </div>
  );
}
