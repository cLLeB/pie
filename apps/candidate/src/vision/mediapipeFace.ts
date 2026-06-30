/**
 * On-device face analysis via MediaPipe FaceLandmarker. Chosen over the plain
 * BlazeFace detector because it keeps tracking the face at tilted angles (e.g.
 * looking down at notes — where the simple detector loses the face entirely) and
 * exposes the head's transformation matrix, from which we derive yaw/pitch to tell
 * if the candidate is oriented toward the screen. Everything runs in the browser —
 * no frame leaves the device.
 *
 * Loaded lazily so it never enters the test/jsdom path or the initial bundle. The
 * WASM + model load from a CDN for convenience; self-host them for air-gapped use.
 */

import { eulerFromMatrix, isFacingScreen, type HeadPose } from './pose';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export interface FaceAnalysis {
  /** Number of faces detected. */
  count: number;
  /** Whether the primary face is oriented toward the screen (true if no face). */
  gazeOnScreen: boolean;
  /** Head pose of the primary face (null if none). */
  pose: HeadPose | null;
}

export interface FaceAnalyzer {
  analyze(video: HTMLVideoElement, timestampMs: number): FaceAnalysis;
  close(): void;
}

export async function createFaceAnalyzer(): Promise<FaceAnalyzer> {
  const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
    numFaces: 2,
    outputFacialTransformationMatrixes: true,
  });

  return {
    analyze(video: HTMLVideoElement, timestampMs: number): FaceAnalysis {
      const result = landmarker.detectForVideo(video, timestampMs);
      const count = result.faceLandmarks?.length ?? 0;
      const matrix = result.facialTransformationMatrixes?.[0]?.data;
      const pose = matrix ? eulerFromMatrix(matrix) : null;
      const gazeOnScreen = count === 0 || pose === null ? true : isFacingScreen(pose);
      return { count, gazeOnScreen, pose };
    },
    close(): void {
      landmarker.close();
    },
  };
}
