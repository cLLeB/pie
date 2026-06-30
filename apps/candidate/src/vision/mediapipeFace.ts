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
import { eyeAversion } from './eyegaze';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** Eye-aversion score above which the candidate is treated as looking away. */
const EYE_AWAY_THRESHOLD = 0.5;

export interface FaceAnalysis {
  /** Number of faces detected. */
  count: number;
  /**
   * Whether the primary face is looking at the screen. When the face is lost
   * (count 0) this is false — losing the face usually means the head turned far
   * away; absence itself is reported separately by face presence.
   */
  gazeOnScreen: boolean;
  /** Head pose of the primary face (null if none). */
  pose: HeadPose | null;
  /** Eye-aversion score (0–1) of the primary face. */
  eyeAway: number;
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
    outputFaceBlendshapes: true,
  });

  return {
    analyze(video: HTMLVideoElement, timestampMs: number): FaceAnalysis {
      const result = landmarker.detectForVideo(video, timestampMs);
      const count = result.faceLandmarks?.length ?? 0;
      const matrix = result.facialTransformationMatrixes?.[0]?.data;
      const pose = matrix ? eulerFromMatrix(matrix) : null;
      const eyeAway = eyeAversion(result.faceBlendshapes?.[0]?.categories ?? []).away;

      // Looking at the screen requires a tracked face that is both oriented toward
      // it (head pose) and not glancing away with the eyes.
      const gazeOnScreen =
        count > 0 && pose !== null && isFacingScreen(pose) && eyeAway < EYE_AWAY_THRESHOLD;

      return { count, gazeOnScreen, pose, eyeAway };
    },
    close(): void {
      landmarker.close();
    },
  };
}
