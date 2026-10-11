import { useCallback, useEffect, useState } from "react";

export type AccessState = "granted" | "denied" | "prompt" | "unknown";

export interface MediaAccess {
  mic: AccessState;
  camera: AccessState;
  microphones: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
}

async function queryPermission(name: "microphone" | "camera"): Promise<AccessState> {
  try {
    // "microphone"/"camera" are valid in Chrome but missing from lib.dom's PermissionName.
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}

/** Permission state + device lists for the extension origin. */
export function useMediaAccess(): MediaAccess & { reload: () => void } {
  const [access, setAccess] = useState<MediaAccess>({
    mic: "unknown",
    camera: "unknown",
    microphones: [],
    cameras: [],
  });

  const reload = useCallback(() => {
    void (async () => {
      const [mic, camera, devices] = await Promise.all([
        queryPermission("microphone"),
        queryPermission("camera"),
        navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]),
      ]);
      setAccess({
        mic,
        camera,
        microphones: devices.filter((d) => d.kind === "audioinput" && d.deviceId),
        cameras: devices.filter((d) => d.kind === "videoinput" && d.deviceId),
      });
    })();
  }, []);

  useEffect(() => {
    reload();
    navigator.mediaDevices.addEventListener("devicechange", reload);
    return () => navigator.mediaDevices.removeEventListener("devicechange", reload);
  }, [reload]);

  return { ...access, reload };
}
