import { describe, expect, it } from "vitest";
import { COUNTDOWN_SECONDS, RECORDING_WARNING_MS } from "@roll/shared";
import {
  initialRecorderState,
  isBusy,
  recorderReducer,
  type RecorderEvent,
  type RecorderState,
  type RecordingOptions,
} from "./recorder-machine";

const options: RecordingOptions = {
  source: "tab",
  tabId: 1,
  mic: true,
  micDeviceId: null,
  camera: true,
  cameraDeviceId: null,
};

function run(events: RecorderEvent[], from: RecorderState = initialRecorderState): RecorderState {
  return events.reduce(recorderReducer, from);
}

const toRecording: RecorderEvent[] = [
  { type: "PREPARE", options },
  { type: "PREPARED" },
  { type: "COUNTDOWN_DONE" },
];

describe("recorderReducer", () => {
  it("walks the happy path idle → … → done", () => {
    let state = run([{ type: "PREPARE", options }, { type: "PREPARED" }]);
    expect(state).toEqual({ status: "countdown", options, remaining: COUNTDOWN_SECONDS });

    state = run([{ type: "COUNTDOWN_TICK" }, { type: "COUNTDOWN_TICK" }], state);
    expect(state).toMatchObject({ status: "countdown", remaining: 1 });

    state = run(
      [
        { type: "COUNTDOWN_DONE" },
        { type: "TICK", elapsedMs: 5000 },
        { type: "STOP" },
        { type: "UPLOAD_STARTED", recordingId: "r1", shareUrl: "https://x/v/abc" },
        { type: "UPLOAD_PROGRESS", progress: 40 },
      ],
      state,
    );
    expect(state).toEqual({
      status: "uploading",
      recordingId: "r1",
      shareUrl: "https://x/v/abc",
      progress: 40,
    });

    state = recorderReducer(state, { type: "UPLOAD_SUCCEEDED" });
    expect(state).toEqual({ status: "done", shareUrl: "https://x/v/abc" });

    expect(recorderReducer(state, { type: "RESET" })).toEqual(initialRecorderState);
  });

  it("toggles recording ⇄ paused and keeps elapsed time", () => {
    let state = run([...toRecording, { type: "TICK", elapsedMs: 3000 }, { type: "PAUSE" }]);
    expect(state).toMatchObject({ status: "paused", elapsedMs: 3000 });
    state = run([{ type: "RESUME" }, { type: "TICK", elapsedMs: 4000 }], state);
    expect(state).toMatchObject({ status: "recording", elapsedMs: 4000 });
  });

  it("stops from paused", () => {
    const state = run([...toRecording, { type: "PAUSE" }, { type: "STOP" }]);
    expect(state.status).toBe("stopping");
  });

  it("never lets the countdown go below 1", () => {
    const state = run([
      { type: "PREPARE", options },
      { type: "PREPARED" },
      ...Array.from({ length: 10 }, () => ({ type: "COUNTDOWN_TICK" }) as const),
    ]);
    expect(state).toMatchObject({ status: "countdown", remaining: 1 });
  });

  it("discards back to idle from any capturing state", () => {
    for (const events of [
      [{ type: "PREPARE", options }],
      [{ type: "PREPARE", options }, { type: "PREPARED" }],
      toRecording,
      [...toRecording, { type: "PAUSE" }],
    ] as RecorderEvent[][]) {
      expect(run([...events, { type: "DISCARD" }])).toEqual(initialRecorderState);
    }
  });

  it("treats STOP during the countdown as a cancel", () => {
    const state = run([{ type: "PREPARE", options }, { type: "PREPARED" }, { type: "STOP" }]);
    expect(state).toEqual(initialRecorderState);
  });

  it("sets the warning flag once past the warning threshold", () => {
    const state = run([...toRecording, { type: "TICK", elapsedMs: RECORDING_WARNING_MS }]);
    expect(state).toMatchObject({ warned: true });
  });

  it("does not move elapsed time backwards", () => {
    const state = run([
      ...toRecording,
      { type: "TICK", elapsedMs: 5000 },
      { type: "TICK", elapsedMs: 4000 },
    ]);
    expect(state).toMatchObject({ elapsedMs: 5000 });
  });

  it("goes to error from any non-idle state and remembers the recording", () => {
    const state = run([
      ...toRecording,
      { type: "STOP" },
      { type: "UPLOAD_STARTED", recordingId: "r1", shareUrl: "https://x/v/a" },
      { type: "FAILED", message: "Network", recordingId: "r1" },
    ]);
    expect(state).toEqual({ status: "error", message: "Network", recordingId: "r1" });
    expect(recorderReducer(state, { type: "RESET" })).toEqual(initialRecorderState);
  });

  it("can retry a failed upload from a resting state", () => {
    const error: RecorderState = { status: "error", message: "x", recordingId: "r1" };
    const state = recorderReducer(error, {
      type: "UPLOAD_STARTED",
      recordingId: "r1",
      shareUrl: "https://x/v/a",
    });
    expect(state).toMatchObject({ status: "uploading", recordingId: "r1", progress: 0 });
    const recording = run(toRecording);
    expect(
      recorderReducer(recording, { type: "UPLOAD_STARTED", recordingId: "r", shareUrl: "u" }),
    ).toBe(recording);
  });

  it("allows starting a new recording from done or error", () => {
    const error: RecorderState = { status: "error", message: "x", recordingId: null };
    expect(recorderReducer(error, { type: "PREPARE", options }).status).toBe("preparing");
  });

  it("returns the same object for invalid transitions", () => {
    const idle = initialRecorderState;
    const invalid: RecorderEvent[] = [
      { type: "PAUSE" },
      { type: "RESUME" },
      { type: "STOP" },
      { type: "DISCARD" },
      { type: "COUNTDOWN_DONE" },
      { type: "UPLOAD_SUCCEEDED" },
      { type: "UPLOAD_PROGRESS", progress: 5 },
      { type: "FAILED", message: "x" },
      { type: "RESET" },
    ];
    for (const event of invalid) expect(recorderReducer(idle, event)).toBe(idle);

    const recording = run(toRecording);
    expect(recorderReducer(recording, { type: "PREPARE", options })).toBe(recording);
    expect(recorderReducer(recording, { type: "RESUME" })).toBe(recording);
  });

  it("reports busy states", () => {
    expect(isBusy(initialRecorderState)).toBe(false);
    expect(isBusy(run(toRecording))).toBe(true);
    expect(isBusy({ status: "done", shareUrl: "x" })).toBe(false);
  });
});
