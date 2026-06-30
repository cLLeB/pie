/**
 * The vision pipeline glue: on each sample it runs the (injected) on-device
 * detectors and feeds the results into the integrity sensors. The detectors are
 * an interface so this is fully unit-tested with fakes; the real implementation
 * (MediaPipe FaceMesh + ONNX YOLO) is the only browser/GPU-bound piece and slots
 * in behind `VisionDetectors` without changing this controller.
 */

export interface VisionDetectors {
  /** Number of faces currently visible. */
  faceCount(): Promise<number>;
  /** Whether the candidate's gaze is on the screen this frame. */
  gazeOnScreen(): Promise<boolean>;
  /** Labels of objects currently visible (e.g. "cell phone"). */
  objectLabels(): Promise<string[]>;
}

export interface VisionSinks {
  presence: { observe(count: number): void };
  gaze: { observe(onScreen: boolean): void };
  objects: { observe(labels: string[]): void };
}

/** Run one detection sample and feed all three sensors. */
export async function runVisionSample(detectors: VisionDetectors, sinks: VisionSinks): Promise<void> {
  const [count, onScreen, labels] = await Promise.all([
    detectors.faceCount(),
    detectors.gazeOnScreen(),
    detectors.objectLabels(),
  ]);
  sinks.presence.observe(count);
  sinks.gaze.observe(onScreen);
  sinks.objects.observe(labels);
}

/**
 * Safe default for when no camera/model is available (server-less demo, denied
 * permission, low-end device): reports a single present face, on-screen gaze, and
 * no objects — so the pipeline runs without flagging anything.
 */
export const noopDetectors: VisionDetectors = {
  faceCount: async () => 1,
  gazeOnScreen: async () => true,
  objectLabels: async () => [],
};
