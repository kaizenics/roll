/** Hard cap on a single recording. */
export const MAX_RECORDING_MS = 30 * 60 * 1000;
/** When the "one minute left" warning is shown. */
export const RECORDING_WARNING_MS = 29 * 60 * 1000;
/** 3-2-1 countdown before the recorder starts. */
export const COUNTDOWN_SECONDS = 3;

export const VIDEO_BITS_PER_SECOND = 2_500_000;
export const RECORDER_TIMESLICE_MS = 1000;

export const SHORT_ID_LENGTH = 10;
/** URL-safe alphabet without look-alike characters (0/O, 1/l/I). */
export const SHORT_ID_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export const TITLE_MAX_LENGTH = 120;
export const DEFAULT_VIDEO_TITLE = "Untitled recording";

export const VIDEO_STATUSES = ["uploading", "processing", "ready", "errored"] as const;

/** Upload retry policy used by the extension. */
export const UPLOAD_MAX_ATTEMPTS = 3;
export const UPLOAD_BACKOFF_BASE_MS = 2000;

/**
 * window.postMessage protocol between /extension/connect and the extension's
 * auth-bridge content script.
 */
export const AUTH_BRIDGE_SOURCE_WEB = "roll-web";
export const AUTH_BRIDGE_SOURCE_EXTENSION = "roll-extension";
export const EXTENSION_CONNECT_PATH = "/extension/connect";
