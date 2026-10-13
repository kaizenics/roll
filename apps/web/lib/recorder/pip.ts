"use client";

import { formatDuration } from "@roll/shared";

/**
 * Floating recording window built on *video* Picture-in-Picture: unlike
 * Document PiP it has no address bar. Controls come from Chrome's own PiP
 * buttons via the Media Session API (play/pause, and the red hang-up button).
 */

export interface PipStatus {
  elapsedMs: number;
  paused: boolean;
}

const WIDTH = 480;
const HEIGHT = 270;

/** A canvas-backed video that shows the timer when there is no camera. */
export function createTimerVideo(): {
  video: HTMLVideoElement;
  draw: (status: PipStatus) => void;
  dispose: () => void;
} {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  // 0 = only push a frame when requestFrame() is called after each draw.
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  // Kept in the DOM (but invisible) so PiP is allowed and frames keep flowing.
  video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.append(video);

  const draw = ({ elapsedMs, paused }: PipStatus) => {
    if (!ctx) return;
    ctx.fillStyle = "#121110";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const dot = paused ? "#fbbf24" : "#e5484d";
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(WIDTH / 2 - 92, HEIGHT / 2 - 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ecebe7";
    ctx.font = "600 64px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(formatDuration(elapsedMs), WIDTH / 2 - 66, HEIGHT / 2 - 8);
    ctx.fillStyle = "rgba(236,235,231,0.55)";
    ctx.font = "500 20px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(paused ? "Paused" : "Recording", WIDTH / 2, HEIGHT / 2 + 52);
    track?.requestFrame();
  };

  draw({ elapsedMs: 0, paused: false });
  void video.play().catch(() => undefined);

  return {
    video,
    draw,
    dispose() {
      stream.getTracks().forEach((t) => t.stop());
      video.remove();
    },
  };
}

export interface PipControls {
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

/** Wires Chrome's PiP buttons to the recorder. Returns a cleanup function. */
export function bindPipControls(video: HTMLVideoElement, controls: PipControls): () => void {
  const session = "mediaSession" in navigator ? navigator.mediaSession : null;
  const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      session?.setActionHandler(action, handler);
    } catch {
      // Older browsers don't know every action (e.g. "hangup").
    }
  };

  set("pause", () => controls.onPause());
  set("play", () => controls.onResume());
  // The red "end call" button in Chrome's PiP window.
  set("hangup" as MediaSessionAction, () => controls.onStop());

  // Without Media Session, Chrome toggles the video itself; mirror that instead.
  const onPauseEvent = () => {
    if (!session) controls.onPause();
  };
  video.addEventListener("pause", onPauseEvent);

  return () => {
    set("pause", null);
    set("play", null);
    set("hangup" as MediaSessionAction, null);
    video.removeEventListener("pause", onPauseEvent);
    if (session) session.playbackState = "none";
  };
}

export function setPipPlaybackState(paused: boolean): void {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = paused ? "paused" : "playing";
  }
}

export function exitPip(): void {
  if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
}
