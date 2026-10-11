import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("keeps relative paths", () => {
    expect(safeNextPath("/extension/connect")).toBe("/extension/connect");
  });

  it("rejects absolute and protocol-relative urls", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});
