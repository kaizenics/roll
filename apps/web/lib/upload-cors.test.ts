import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadCorsOrigin } from "./http";
import { pickMimeType } from "./recorder/media";

const withOrigin = (origin?: string) =>
  new Request("http://localhost:3000/api/videos", {
    method: "POST",
    headers: origin ? { origin } : {},
  });

describe("uploadCorsOrigin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the web app itself (browser recorder)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://roll.kaizenics.dev");
    expect(uploadCorsOrigin(withOrigin("https://roll.kaizenics.dev"))).toBe(
      "https://roll.kaizenics.dev",
    );
  });

  it("allows the configured extension", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://roll.kaizenics.dev");
    vi.stubEnv("EXTENSION_ID", "abcdefghijklmnop");
    expect(uploadCorsOrigin(withOrigin("chrome-extension://abcdefghijklmnop"))).toBe(
      "chrome-extension://abcdefghijklmnop",
    );
  });

  it("never echoes an untrusted origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://roll.kaizenics.dev");
    expect(uploadCorsOrigin(withOrigin("https://evil.example"))).toBe("https://roll.kaizenics.dev");
    expect(uploadCorsOrigin(withOrigin())).toBe("https://roll.kaizenics.dev");
  });
});

describe("pickMimeType", () => {
  it("prefers VP9 webm, falls back to mp4 for Safari", () => {
    expect(pickMimeType(() => true)).toBe("video/webm;codecs=vp9,opus");
    expect(pickMimeType((type) => type === "video/mp4")).toBe("video/mp4");
    expect(pickMimeType(() => false)).toBe("");
  });
});
