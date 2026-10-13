"use client";

import {
  COUNTDOWN_SECONDS,
  formatDuration,
  MAX_RECORDING_MS,
  RECORDING_WARNING_MS,
  type CreateVideoResponse,
} from "@roll/shared";
import { Link2, Loader2, Pause, PictureInPicture2, Play, Square, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceSelect, ToggleRow } from "@/components/recorder/fields";
import { createVideo, shareVideo } from "@/lib/api-client";
import {
  canRecordScreen,
  createRecordingSession,
  finishRecording,
  requestCamera,
  requestDisplay,
  requestMic,
  type RecordingSession,
} from "@/lib/recorder/media";
import {
  bindPipControls,
  createTimerVideo,
  exitPip,
  setPipPlaybackState,
} from "@/lib/recorder/pip";
import { uploadToMux } from "@/lib/recorder/upload";

type Phase = "setup" | "countdown" | "recording" | "paused" | "uploading" | "uploaded" | "failed";

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** Sends a pre-opened tab to the video page, or offers a link if the browser blocked it. */
function openVideoPage(tab: Window | null, path: string) {
  if (tab && !tab.closed) {
    tab.location.href = path;
    return;
  }
  // No click behind this stop (e.g. Chrome's "Stop sharing" bar), so no new tab.
  toast.success("Your video page is ready", {
    action: { label: "Open video", onClick: () => window.open(path, "_blank") },
    duration: 15_000,
  });
}

/** Records the screen in the browser (no extension) and uploads straight to Mux. */
export function WebRecorder() {
  const [supported, setSupported] = useState(true);
  const [phase, setPhase] = useState<Phase>("setup");
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(false);
  const [micId, setMicId] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  // Floating window content: the camera when it is on, otherwise a timer card.
  const timerVideo = useRef<ReturnType<typeof createTimerVideo> | null>(null);
  const [pipSupported, setPipSupported] = useState(false);
  const pipVideo = () => (camera ? previewRef.current : (timerVideo.current?.video ?? null));
  const cameraStream = useRef<MediaStream | null>(null);
  const session = useRef<RecordingSession | null>(null);
  const blob = useRef<Blob | null>(null);
  const target = useRef<CreateVideoResponse | null>(null);
  const clock = useRef({ accumulated: 0, since: 0 });

  const refreshDevices = useCallback(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((list) => setDevices(list.filter((d) => d.deviceId)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setSupported(canRecordScreen());
    refreshDevices();
  }, [refreshDevices]);

  // Live camera preview; the same <video> is popped out as the camera bubble.
  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    requestCamera(cameraId)
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        cameraStream.current = s;
        if (previewRef.current) previewRef.current.srcObject = s;
        refreshDevices();
      })
      .catch(() => {
        toast.error("Camera access was blocked. Allow it in the address bar and try again.");
        setCamera(false);
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      cameraStream.current = null;
      if (document.pictureInPictureElement)
        void document.exitPictureInPicture().catch(() => undefined);
    };
  }, [camera, cameraId, refreshDevices]);

  const elapsed = useCallback(
    () =>
      clock.current.accumulated +
      (clock.current.since ? performance.now() - clock.current.since : 0),
    [],
  );

  /** `tab` is a pre-opened tab to send to the video page once it exists. */
  const upload = useCallback(async (tab: Window | null = null) => {
    const file = blob.current;
    if (!file) {
      tab?.close();
      return;
    }
    setPhase("uploading");
    setProgress(0);
    setError(null);
    try {
      if (!target.current) {
        target.current = await createVideo();
        openVideoPage(tab, `/v/${target.current.shortId}`);
      }
      await uploadToMux(file, target.current.uploadUrl, setProgress);
      blob.current = null;
      setShareUrl(null);
      setPhase("uploaded");
    } catch (err) {
      if (!target.current) tab?.close();
      setError(message(err));
      setPhase("failed");
    }
  }, []);

  // The link is only revealed and copied when the user asks for it.
  async function generateLink() {
    const video = target.current;
    if (!video) return;
    let url = shareUrl;
    if (!url) {
      try {
        url = (await shareVideo(video.id)).shareUrl;
      } catch (err) {
        toast.error(message(err));
        return;
      }
      setShareUrl(url);
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.info("Copy the link below to share it.");
    }
  }

  function recordAnother() {
    target.current = null;
    setShareUrl(null);
    setPhase("setup");
  }

  const stop = useCallback(async () => {
    const current = session.current;
    if (!current) return;
    // Open the tab now, while the Stop click still counts as a user gesture;
    // browsers block window.open after an await. It is pointed at the video later.
    const tab = window.open("", "_blank");
    if (tab) {
      tab.document.title = "Roll";
      tab.document.body.style.cssText = "margin:0;background:#161513;";
    }
    session.current = null;
    clock.current = { accumulated: elapsed(), since: 0 };
    exitPip();
    blob.current = await finishRecording(current);
    if (blob.current.size === 0) {
      tab?.close();
      setError("The recording is empty. Please try again.");
      setPhase("setup");
      return;
    }
    void upload(tab);
  }, [elapsed, upload]);

  const discard = useCallback(() => {
    const current = session.current;
    session.current = null;
    current?.recorder.stop();
    current?.release();
    blob.current = null;
    exitPip();
    setPhase("setup");
  }, []);

  // Timer, 30-minute cap and the one-minute warning.
  useEffect(() => {
    if (phase !== "recording") return;
    let warned = elapsed() >= RECORDING_WARNING_MS;
    const timer = setInterval(() => {
      const ms = elapsed();
      setElapsedMs(ms);
      timerVideo.current?.draw({ elapsedMs: ms, paused: false });
      if (!warned && ms >= RECORDING_WARNING_MS) {
        warned = true;
        toast.warning("One minute left. Recordings stop at 30:00.");
      }
      if (ms >= MAX_RECORDING_MS) void stop();
    }, 250);
    return () => clearInterval(timer);
  }, [phase, elapsed, stop]);

  async function start() {
    setError(null);
    // Both need the click's user activation, so start them before awaiting anything.
    timerVideo.current?.draw({ elapsedMs: 0, paused: false });
    const video = pipVideo();
    const pip: Promise<unknown> =
      pipSupported && video
        ? video.requestPictureInPicture().catch(() => null)
        : Promise.resolve(null);
    let display: MediaStream;
    try {
      display = await requestDisplay();
    } catch (err) {
      await pip;
      exitPip();
      // NotAllowedError = the user closed the picker; that is not an error.
      if (!(err instanceof DOMException && err.name === "NotAllowedError")) setError(message(err));
      return;
    }
    await pip;

    let micStream: MediaStream | null = null;
    if (mic) {
      try {
        micStream = await requestMic(micId);
      } catch {
        toast.error("Microphone blocked. Recording without your voice.");
      }
    }

    // Chrome's "Stop sharing" button ends the video track.
    display.getVideoTracks()[0]?.addEventListener("ended", () => void stop());

    setPhase("countdown");
    for (let n = COUNTDOWN_SECONDS; n > 0; n -= 1) {
      setCountdown(n);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (display.getVideoTracks()[0]?.readyState === "ended") {
      micStream?.getTracks().forEach((t) => t.stop());
      setPhase("setup");
      return;
    }

    session.current = createRecordingSession(display, micStream);
    target.current = null;
    clock.current = { accumulated: 0, since: performance.now() };
    setElapsedMs(0);
    setPhase("recording");
  }

  const pause = useCallback(() => {
    const recorder = session.current?.recorder;
    if (recorder?.state !== "recording") return;
    recorder.pause();
    clock.current = { accumulated: elapsed(), since: 0 };
    setElapsedMs(clock.current.accumulated);
    timerVideo.current?.draw({ elapsedMs: clock.current.accumulated, paused: true });
    setPhase("paused");
  }, [elapsed]);

  const resume = useCallback(() => {
    const recorder = session.current?.recorder;
    if (recorder?.state !== "paused") return;
    recorder.resume();
    clock.current.since = performance.now();
    setPhase("recording");
  }, []);

  function togglePause() {
    if (session.current?.recorder.state === "paused") resume();
    else pause();
  }

  // Chrome's PiP buttons: play/pause pauses and resumes, the red hang-up button stops.
  const live = phase === "recording" || phase === "paused";
  useEffect(() => {
    if (!live) return;
    const video = camera ? previewRef.current : (timerVideo.current?.video ?? null);
    if (!video) return;
    return bindPipControls(video, { onPause: pause, onResume: resume, onStop: () => void stop() });
  }, [live, camera, pause, resume, stop]);

  useEffect(() => {
    if (live) setPipPlaybackState(phase === "paused");
  }, [live, phase]);

  // The timer card exists for the whole page visit, so PiP can open instantly.
  useEffect(() => {
    if (!document.pictureInPictureEnabled) return;
    setPipSupported(true);
    timerVideo.current = createTimerVideo();
    return () => {
      timerVideo.current?.dispose();
      timerVideo.current = null;
    };
  }, []);

  if (!supported) {
    return (
      <p role="alert" className="text-muted-foreground max-w-[60ch]">
        This browser can’t record the screen. Use Chrome, Edge or Firefox on a computer, or install
        the Roll extension.
      </p>
    );
  }

  const microphones = devices.filter((d) => d.kind === "audioinput");
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const busy = phase !== "setup" && phase !== "failed";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem] md:items-start">
      <div className="bg-card relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          className={`size-full -scale-x-100 object-cover ${camera ? "" : "hidden"}`}
        />
        {!camera && (
          <p className="text-muted-foreground px-6 text-center text-sm">
            Turn on the camera to add your face as a floating bubble.
          </p>
        )}
        {phase === "countdown" && (
          <div
            role="status"
            aria-live="assertive"
            className="bg-background/80 absolute inset-0 flex items-center justify-center font-serif text-8xl"
          >
            {countdown}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {phase === "setup" || phase === "failed" ? (
          <>
            <ToggleRow id="mic" label="Microphone" checked={mic} onChange={setMic} />
            <DeviceSelect
              id="mic-device"
              label="Microphone device"
              devices={microphones}
              value={micId}
              onChange={setMicId}
              disabled={!mic}
            />
            <ToggleRow id="camera" label="Camera bubble" checked={camera} onChange={setCamera} />
            <DeviceSelect
              id="camera-device"
              label="Camera device"
              devices={cameras}
              value={cameraId}
              onChange={setCameraId}
              disabled={!camera}
            />
            {error && (
              <p
                role="alert"
                className="bg-tint-red text-tint-red-foreground rounded-md p-3 text-sm"
              >
                {error}
              </p>
            )}
            {phase === "failed" ? (
              <div className="grid gap-2">
                <Button size="lg" onClick={() => void upload(null)}>
                  Retry upload
                </Button>
                <Button variant="ghost" onClick={discard}>
                  Discard recording
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => void start()}>
                <span aria-hidden className="bg-record size-2.5 rounded-full" />
                Start recording
              </Button>
            )}
            <p className="text-muted-foreground text-xs">
              Your browser will ask what to share: a tab, a window or your entire screen.
            </p>
          </>
        ) : phase === "uploading" ? (
          <div role="status" className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-medium">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Uploading {progress}%
            </p>
            <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm">Keep this tab open until it finishes.</p>
          </div>
        ) : phase === "uploaded" ? (
          <div className="flex flex-col gap-3">
            <p role="status" className="font-medium">
              Upload complete. Your video is processing.
            </p>
            {shareUrl ? (
              <>
                <label htmlFor="share-url" className="sr-only">
                  Shareable link
                </label>
                <Input
                  id="share-url"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => void generateLink()}>
                    <Link2 aria-hidden />
                    Copy again
                  </Button>
                  <Button asChild>
                    <a href={shareUrl}>Open video</a>
                  </Button>
                </div>
              </>
            ) : (
              <Button size="lg" onClick={() => void generateLink()}>
                <Link2 aria-hidden />
                Generate Shareable Link
              </Button>
            )}
            <Button variant="ghost" onClick={recordAnother}>
              Record another
            </Button>
          </div>
        ) : (
          busy && (
            <div className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-3xl tabular-nums" role="timer">
                <span
                  aria-hidden
                  className={`size-3 rounded-full ${phase === "paused" ? "bg-tint-yellow-foreground" : "bg-record animate-pulse"}`}
                />
                {formatDuration(elapsedMs)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={togglePause} disabled={phase === "countdown"}>
                  {phase === "paused" ? <Play aria-hidden /> : <Pause aria-hidden />}
                  {phase === "paused" ? "Resume" : "Pause"}
                </Button>
                <Button onClick={() => void stop()} disabled={phase === "countdown"}>
                  <Square aria-hidden />
                  Stop
                </Button>
              </div>
              <Button variant="ghost" onClick={discard} className="text-destructive">
                <Trash2 aria-hidden />
                Discard
              </Button>
              {pipSupported && (
                <Button
                  variant="outline"
                  onClick={() =>
                    void pipVideo()
                      ?.requestPictureInPicture()
                      .catch(() => undefined)
                  }
                >
                  <PictureInPicture2 aria-hidden />
                  Pop out controls
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
