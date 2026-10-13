"use client";

import { RECORDER_TIMESLICE_MS, VIDEO_BITS_PER_SECOND } from "@roll/shared";

// mp4 last: Safari records mp4, Chromium browsers prefer webm.
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export function pickMimeType(isSupported: (type: string) => boolean): string {
  return MIME_CANDIDATES.find((type) => isSupported(type)) ?? "";
}

export function canRecordScreen(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Newer getDisplayMedia options not yet in lib.dom.d.ts. */
interface ExtendedDisplayMediaOptions extends DisplayMediaStreamOptions {
  systemAudio?: "include" | "exclude";
  selfBrowserSurface?: "include" | "exclude";
  monitorTypeSurfaces?: "include" | "exclude";
}

/** Opens the browser's screen / window / tab picker. Must run inside a user gesture. */
export function requestDisplay(): Promise<MediaStream> {
  const options: ExtendedDisplayMediaOptions = {
    video: { frameRate: { ideal: 30, max: 30 }, width: { max: 1920 }, height: { max: 1080 } },
    audio: true,
    systemAudio: "include",
    selfBrowserSurface: "include",
    monitorTypeSurfaces: "include",
  };
  return navigator.mediaDevices.getDisplayMedia(options);
}

export function requestMic(deviceId: string | null): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

export function requestCamera(deviceId: string | null): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 640 },
      height: { ideal: 640 },
    },
    audio: false,
  });
}

export interface RecordingSession {
  recorder: MediaRecorder;
  mimeType: string;
  chunks: Blob[];
  /** Stops every track and closes the audio graph. */
  release(): void;
}

/** Mixes shared-tab/system audio with the mic into one track and wires up MediaRecorder. */
export function createRecordingSession(
  display: MediaStream,
  mic: MediaStream | null,
): RecordingSession {
  const audioSources = [display, mic].filter(
    (stream): stream is MediaStream => stream !== null && stream.getAudioTracks().length > 0,
  );
  let audioContext: AudioContext | null = null;
  let audioTracks: MediaStreamTrack[] = [];
  if (audioSources.length > 0) {
    audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    for (const stream of audioSources) {
      audioContext.createMediaStreamSource(stream).connect(destination);
    }
    audioTracks = destination.stream.getAudioTracks();
  }

  const mimeType = pickMimeType((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(
    new MediaStream([...display.getVideoTracks(), ...audioTracks]),
    { mimeType: mimeType || undefined, videoBitsPerSecond: VIDEO_BITS_PER_SECOND },
  );
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  recorder.start(RECORDER_TIMESLICE_MS);

  return {
    recorder,
    mimeType: recorder.mimeType || mimeType || "video/webm",
    chunks,
    release() {
      for (const stream of [display, mic]) stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close().catch(() => undefined);
    },
  };
}

/** Stops the recorder and resolves with the final file. */
export function finishRecording(session: RecordingSession): Promise<Blob> {
  return new Promise((resolve) => {
    const done = () => {
      session.release();
      resolve(new Blob(session.chunks, { type: session.mimeType }));
    };
    if (session.recorder.state === "inactive") return done();
    session.recorder.addEventListener("stop", done, { once: true });
    session.recorder.stop();
  });
}
