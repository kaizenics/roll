import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { sendToBackground } from "@/lib/messaging";
import type { CaptureSource } from "@/lib/recorder-machine";
import { getPreferences, setPreferences, type Preferences } from "@/lib/storage";
import { useMediaAccess, type AccessState } from "../hooks/useMediaAccess";
import { Alert, Button, Toggle } from "./ui";

const SOURCES: Array<{ value: CaptureSource; label: string }> = [
  { value: "screen", label: "Screen" },
  { value: "window", label: "Window" },
  { value: "tab", label: "Current tab" },
];

function needsGrant(enabled: boolean, state: AccessState): boolean {
  return enabled && state !== "granted";
}

async function openPermissionsPage(mic: boolean, camera: boolean): Promise<void> {
  const url = new URL(browser.runtime.getURL("/permissions.html"));
  if (mic) url.searchParams.set("mic", "1");
  if (camera) url.searchParams.set("camera", "1");
  await browser.tabs.create({ url: url.toString() });
  window.close();
}

function DeviceSelect({
  id,
  label,
  devices,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  devices: MediaDeviceInfo[];
  value: string | null;
  onChange: (deviceId: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
      >
        <option value="">System default</option>
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RecordForm() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const access = useMediaAccess();

  useEffect(() => {
    void getPreferences().then(setPrefs);
  }, []);

  if (!prefs) return null;

  const update = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    void setPreferences(next);
  };

  const missingMic = needsGrant(prefs.mic, access.mic);
  const missingCamera = needsGrant(prefs.camera, access.camera);

  async function start() {
    if (!prefs) return;
    setError(null);
    if (missingMic || missingCamera) {
      await openPermissionsPage(missingMic, missingCamera);
      return;
    }
    setStarting(true);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) {
      setError("Couldn't find the current tab.");
      setStarting(false);
      return;
    }
    const response = await sendToBackground({
      target: "background",
      type: "START",
      options: { ...prefs, tabId: tab.id },
    });
    if (!response.ok) {
      setError(response.error);
      setStarting(false);
      return;
    }
    // Get out of the way so the picker / page countdown is visible.
    window.close();
  }

  return (
    <section className="flex flex-col gap-4 p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Record</legend>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
          role="radiogroup"
        >
          {SOURCES.map((source) => (
            <button
              key={source.value}
              type="button"
              role="radio"
              aria-checked={prefs.source === source.value}
              onClick={() => update({ source: source.value })}
              className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                prefs.source === source.value
                  ? "bg-white font-medium shadow-sm dark:bg-zinc-700"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Toggle
          id="mic-toggle"
          label="Microphone"
          checked={prefs.mic}
          onChange={(mic) => update({ mic })}
        />
        <DeviceSelect
          id="mic-device"
          label="Microphone"
          devices={access.microphones}
          value={prefs.micDeviceId}
          disabled={!prefs.mic}
          onChange={(micDeviceId) => update({ micDeviceId })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Toggle
          id="camera-toggle"
          label="Camera bubble"
          checked={prefs.camera}
          onChange={(camera) => update({ camera })}
        />
        <DeviceSelect
          id="camera-device"
          label="Camera"
          devices={access.cameras}
          value={prefs.cameraDeviceId}
          disabled={!prefs.camera}
          onChange={(cameraDeviceId) => update({ cameraDeviceId })}
        />
      </div>

      {(missingMic || missingCamera) && (
        <Alert tone="info">
          Roll needs one-time access to your{" "}
          {missingMic && missingCamera
            ? "microphone and camera"
            : missingMic
              ? "microphone"
              : "camera"}
          .
        </Alert>
      )}
      {error && <Alert>{error}</Alert>}

      <Button className="h-11 text-base" onClick={() => void start()} disabled={starting}>
        <span aria-hidden className="size-3 rounded-full bg-red-500 ring-2 ring-white/70" />
        {missingMic || missingCamera ? "Allow access" : starting ? "Starting…" : "Start recording"}
      </Button>
    </section>
  );
}
