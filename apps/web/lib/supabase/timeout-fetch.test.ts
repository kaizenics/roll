import { afterEach, describe, expect, it, vi } from "vitest";
import { timeoutFetch } from "./timeout-fetch";

/** A fetch that never answers, only rejecting when its signal aborts. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
  });
}

describe("timeoutFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects a request that hangs past the timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));
    await expect(timeoutFetch(20)("https://example.test")).rejects.toThrow();
  });

  it("passes a fast response through untouched", async () => {
    const response = new Response("ok");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );
    await expect(timeoutFetch(1000)("https://example.test")).resolves.toBe(response);
  });
});
