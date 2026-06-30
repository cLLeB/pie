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

import { isLookingForward, gazeRatio, type Keypoint } from './gaze';

export interface FaceAnalysis {
  /** Number of faces detected. */
  count: number;
  /** Whether the primary face is oriented toward the screen (true if no face). */
  gazeOnScreen: boolean;
  /** Debug: number of keypoints the detector returned for the primary face. */
  keypointCount: number;
  /** Debug: signed gaze ratio (null if undetermined). */
  gazeRatio: number | null;
}

export interface FaceAnalyzer {
  analyze(video: HTMLVideoElement, timestampMs: number): FaceAnalysis;
  close(): void;
}

export async function createFaceAnalyzer(): Promise<FaceAnalyzer> {
  const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
    // More forgiving than the 0.5 default so borderline / partially-cropped faces
    // (e.g. leaning in to read) still register.
    minDetectionConfidence: 0.35,
  });

  return {
    analyze(video: HTMLVideoElement, timestampMs: number): FaceAnalysis {
      const result = detector.detectForVideo(video, timestampMs);
      const count = result.detections.length;
      const keypoints: Keypoint[] = (result.detections[0]?.keypoints ?? []).map((k) => ({
        x: k.x,
        y: k.y,
      }));
      return {
        count,
        gazeOnScreen: count === 0 ? true : isLookingForward(keypoints),
        keypointCount: keypoints.length,
        gazeRatio: gazeRatio(keypoints),
      };
    },
    close(): void {
      detector.close();
    },
  };
}
