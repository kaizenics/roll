/** Camera preview rendered inside the bubble iframe (extension origin). */
async function start(): Promise<void> {
  const video = document.querySelector("video");
  if (!video) return;
  const deviceId = new URLSearchParams(location.search).get("deviceId");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 640 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });
    video.srcObject = stream;
    window.addEventListener("pagehide", () => stream.getTracks().forEach((t) => t.stop()));
  } catch {
    const message = document.createElement("p");
    message.textContent = "Camera unavailable. Allow camera access in the Roll popup.";
    document.body.append(message);
  }
}

void start();
