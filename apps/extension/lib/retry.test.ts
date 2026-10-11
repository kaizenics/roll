import { describe, expect, it, vi } from "vitest";
import { retryWithBackoff } from "./retry";

describe("retryWithBackoff", () => {
  it("returns the first successful result", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("a")).mockResolvedValueOnce("ok");
    const sleep = vi.fn(async () => undefined);
    await expect(retryWithBackoff(fn, { attempts: 3, baseDelayMs: 100, sleep })).resolves.toBe(
      "ok",
    );
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it("backs off exponentially and rethrows the last error", async () => {
    const fn = vi.fn(async (attempt: number) => {
      throw new Error(`fail ${attempt}`);
    });
    const sleep = vi.fn(async () => undefined);
    await expect(retryWithBackoff(fn, { attempts: 3, baseDelayMs: 100, sleep })).rejects.toThrow(
      "fail 3",
    );
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[100], [200]]);
  });
});
