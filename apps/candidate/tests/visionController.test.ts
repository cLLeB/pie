import { describe, it, expect } from 'vitest';
import { runVisionSample, noopDetectors, type VisionDetectors } from '../src/vision/visionController';
import {
  FacePresenceSensor,
  GazeSensor,
  ProhibitedObjectSensor,
  Ledger,
} from '@pie/integrity-core';

function sinks(led: Ledger) {
  const sink = (type: string, data?: Record<string, unknown>) => led.append(type, data);
  return {
    presence: new FacePresenceSensor(sink, 1), // immediate absence for the test
    gaze: new GazeSensor(sink, 1),
    objects: new ProhibitedObjectSensor(sink),
  };
}

describe('runVisionSample', () => {
  it('feeds detector results into the sensors → ledger events', async () => {
    const led = new Ledger();
    const detectors: VisionDetectors = {
      faceCount: async () => 0, // nobody there
      gazeOnScreen: async () => false, // looking away (threshold 1 → flags)
      objectLabels: async () => ['cell phone'],
    };

    await runVisionSample(detectors, sinks(led));

    const types = led.export().map((e) => e.type);
    expect(types).toContain('face.absent');
    expect(types).toContain('gaze.offscreen');
    expect(types).toContain('object.detected');
  });

  it('noopDetectors produce a clean sample with no flags', async () => {
    const led = new Ledger();
    await runVisionSample(noopDetectors, sinks(led));
    const types = led.export().map((e) => e.type);
    expect(types).toEqual(['face.present']); // present face, on-screen gaze, no objects
  });
});
