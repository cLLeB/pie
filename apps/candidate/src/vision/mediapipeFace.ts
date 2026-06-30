/**
 * On-device face detector backed by MediaPipe Tasks Vision (BlazeFace). Runs
 * entirely in the browser — no frame ever leaves the device, which is what makes
 * the "footage stored: none" promise true. Loaded lazily so it never enters the
 * test/jsdom path or the initial bundle.
 *
 * NOTE: the WASM + model load from a CDN here for convenience. For an offline /
 * air-gapped deployment, self-host these assets and point the resolver at them.
 */

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

export interface FaceCounter {
  /** Detect faces in the current video frame; returns the count. */
  detect(video: HTMLVideoElement, timestampMs: number): number;
  close(): void;
}

export async function createFaceCounter(): Promise<FaceCounter> {
  const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
  });

  return {
    detect(video: HTMLVideoElement, timestampMs: number): number {
      const result = detector.detectForVideo(video, timestampMs);
      return result.detections.length;
    },
    close(): void {
      detector.close();
    },
  };
}
