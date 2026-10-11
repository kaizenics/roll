import { MAX_RECORDING_MS, RECORDER_TIMESLICE_MS, VIDEO_BITS_PER_SECOND } from "@roll/shared";
import { appendChunk, putRecordingMeta } from "./chunk-store";
import type { CaptureSource } from "./recorder-machine";

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

export function pickMimeType(isSupported: (type: string) => boolean): string {
  return MIME_CANDIDATES.find((type) => isSupported(type)) ?? "video/webm";
}

/** Chrome-only `mandatory` constraints used with tabCapture stream ids. */
interface ChromeTabConstraints {
  audio: { mandatory: { chromeMediaSource: "tab"; chromeMediaSourceId: string } };
  video: {
    mandatory: {
      chromeMediaSource: "tab";
      chromeMediaSourceId: string;
      maxWidth: number;
      maxHeight: number;
      maxFrameRate: number;
    };
  };
}

/** Newer getDisplayMedia options not yet in lib.dom.d.ts. */
interface ExtendedDisplayMediaOptions extends DisplayMediaStreamOptions {
  systemAudio?: "include" | "exclude";
  selfBrowserSurface?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
  monitorTypeSurfaces?: "include" | "exclude";
}

export interface PrepareOptions {
  source: CaptureSource;
  tabStreamId: string | null;
  mic: boolean;
  micDeviceId: string | null;
}

export interface RecorderEvents {
  onTick(elapsedMs: number): void;
  /** The user clicked Chrome's "Stop sharing" or the captured tab went away. */
  onSourceEnded(): void;
  onLimitReached(): void;
}

export interface FinishedRecording {
  recordingId: string;
  durationMs: number;
  size: number;
  blob: Blob;
}

/**
 * Owns every MediaStream and the MediaRecorder. Lives in the offscreen document
 * so recording survives popup closes and tab navigations.
 */
export class ScreenRecorder {
  private display: MediaStream | null = null;
  private mic: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private pendingWrites: Promise<void> = Promise.resolve();
  private chunkIndex = 0;
  private recordingId: string | null = null;
  private mimeType = "video/webm";
  private accumulatedMs = 0;
  private segmentStart: number | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private stopping = false;

  constructor(private readonly events: RecorderEvents) {}

  get isPrepared(): boolean {
    return this.display !== null;
  }

  /** Acquires capture + mic streams. Throws DOMException(NotAllowedError) if the picker is cancelled. */
  async prepare(options: PrepareOptions): Promise<void> {
    await this.cleanup();
    this.stopping = false;

    this.display = await this.captureSource(options);
    for (const track of this.display.getVideoTracks()) {
      track.addEventListener("ended", () => {
        if (!this.stopping) this.events.onSourceEnded();
      });
    }

    if (options.mic) {
      try {
        this.mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: options.micDeviceId ? { exact: options.micDeviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (error) {
        await this.cleanup();
        // Re-thrown as a plain Error so it isn't mistaken for a cancelled picker.
        const name = error instanceof DOMException ? error.name : "";
        throw new Error(
          name === "NotAllowedError"
            ? "Microphone access is blocked. Open the Roll popup and allow it."
            : "Couldn't start the microphone. Check that it's connected.",
        );
      }
    }
  }

  private async captureSource(options: PrepareOptions): Promise<MediaStream> {
    if (options.source === "tab") {
      if (!options.tabStreamId) throw new Error("Missing tab stream id");
      const constraints: ChromeTabConstraints = {
        audio: {
          mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: options.tabStreamId },
        },
        video: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: options.tabStreamId,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30,
          },
        },
      };
      return navigator.mediaDevices.getUserMedia(constraints as unknown as MediaStreamConstraints);
    }

    // getDisplayMedia in an offscreen document (reason DISPLAY_MEDIA) is the
    // documented MV3 approach; `displaySurface` pre-selects the picker tab.
    const displayOptions: ExtendedDisplayMediaOptions = {
      video: {
        displaySurface: options.source === "screen" ? "monitor" : "window",
        frameRate: { ideal: 30, max: 30 },
        width: { max: 1920 },
        height: { max: 1080 },
      },
      audio: true,
      systemAudio: "include",
      selfBrowserSurface: "exclude",
      surfaceSwitching: "exclude",
      monitorTypeSurfaces: "include",
    };
    return navigator.mediaDevices.getDisplayMedia(displayOptions);
  }

  /** Mixes capture audio + mic into a single track with the Web Audio API. */
  private buildRecordingStream(source: CaptureSource): MediaStream {
    if (!this.display) throw new Error("Recorder not prepared");
    const videoTracks = this.display.getVideoTracks();
    const sourceAudio = this.display.getAudioTracks();
    const micAudio = this.mic?.getAudioTracks() ?? [];
    if (sourceAudio.length === 0 && micAudio.length === 0) return new MediaStream(videoTracks);

    const context = new AudioContext();
    this.audioContext = context;
    void context.resume();
    const destination = context.createMediaStreamDestination();

    if (sourceAudio.length > 0) {
      const node = context.createMediaStreamSource(new MediaStream(sourceAudio));
      node.connect(destination);
      // Tab capture mutes the tab for the user; route it back to the speakers.
      if (source === "tab") node.connect(context.destination);
    }
    if (micAudio.length > 0) {
      context.createMediaStreamSource(new MediaStream(micAudio)).connect(destination);
    }
    return new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
  }

  async start(source: CaptureSource): Promise<string> {
    const stream = this.buildRecordingStream(source);
    this.mimeType = pickMimeType((type) => MediaRecorder.isTypeSupported(type));
    const recordingId = crypto.randomUUID();
    this.recordingId = recordingId;
    this.chunks = [];
    this.chunkIndex = 0;
    this.accumulatedMs = 0;

    await putRecordingMeta({
      id: recordingId,
      mimeType: this.mimeType,
      createdAt: Date.now(),
      durationMs: 0,
      complete: false,
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: this.mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: 128_000,
    });
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size === 0) return;
      this.chunks.push(event.data);
      const index = this.chunkIndex++;
      this.pendingWrites = this.pendingWrites
        .then(() => appendChunk(recordingId, index, event.data))
        .catch((error: unknown) => console.warn("IndexedDB backup failed", error));
    });
    recorder.start(RECORDER_TIMESLICE_MS);
    this.recorder = recorder;
    this.segmentStart = performance.now();
    this.tickTimer = setInterval(() => this.tick(), 1000);
    return recordingId;
  }

  elapsedMs(): number {
    const running = this.segmentStart === null ? 0 : performance.now() - this.segmentStart;
    return this.accumulatedMs + running;
  }

  private tick(): void {
    const elapsed = this.elapsedMs();
    this.events.onTick(elapsed);
    if (elapsed >= MAX_RECORDING_MS && !this.stopping) this.events.onLimitReached();
  }

  pause(): void {
    if (this.recorder?.state !== "recording") return;
    this.recorder.pause();
    this.accumulatedMs = this.elapsedMs();
    this.segmentStart = null;
    this.events.onTick(this.accumulatedMs);
  }

  resume(): void {
    if (this.recorder?.state !== "paused") return;
    this.recorder.resume();
    this.segmentStart = performance.now();
  }

  async stop(): Promise<FinishedRecording> {
    const recorder = this.recorder;
    const recordingId = this.recordingId;
    if (!recorder || !recordingId) throw new Error("Not recording");
    this.stopping = true;
    const durationMs = this.elapsedMs();

    if (recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
    }
    await this.pendingWrites;
    const blob = new Blob(this.chunks, { type: this.mimeType });
    await putRecordingMeta({
      id: recordingId,
      mimeType: this.mimeType,
      createdAt: Date.now(),
      durationMs,
      complete: true,
    });
    await this.cleanup();
    return { recordingId, durationMs, size: blob.size, blob };
  }

  /** Stops everything and returns the id of the abandoned recording, if any. */
  async discard(): Promise<string | null> {
    this.stopping = true;
    const recordingId = this.recordingId;
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    await this.pendingWrites;
    await this.cleanup();
    return recordingId;
  }

  private async cleanup(): Promise<void> {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
    for (const stream of [this.display, this.mic]) {
      stream?.getTracks().forEach((track) => track.stop());
    }
    this.display = null;
    this.mic = null;
    this.recorder = null;
    this.recordingId = null;
    this.segmentStart = null;
    this.chunks = [];
    if (this.audioContext) await this.audioContext.close().catch(() => undefined);
    this.audioContext = null;
  }
}
