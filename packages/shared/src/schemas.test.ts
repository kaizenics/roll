import { describe, expect, it } from "vitest";
import {
  apiErrorSchema,
  authBridgeWebMessageSchema,
  createVideoRequestSchema,
  shortIdSchema,
  updateVideoRequestSchema,
} from "./schemas";
import { TITLE_MAX_LENGTH } from "./constants";
import { formatDuration } from "./format";
import { buildShareUrl } from "./urls";

describe("updateVideoRequestSchema", () => {
  it("accepts and trims a title within bounds", () => {
    expect(updateVideoRequestSchema.parse({ title: "  Demo  " })).toEqual({ title: "Demo" });
  });

  it("rejects empty and whitespace-only titles", () => {
    expect(updateVideoRequestSchema.safeParse({ title: "" }).success).toBe(false);
    expect(updateVideoRequestSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("enforces the max length", () => {
    const max = "a".repeat(TITLE_MAX_LENGTH);
    expect(updateVideoRequestSchema.safeParse({ title: max }).success).toBe(true);
    expect(updateVideoRequestSchema.safeParse({ title: `${max}a` }).success).toBe(false);
  });

  it("rejects a missing title", () => {
    expect(updateVideoRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("createVideoRequestSchema", () => {
  it("allows an empty body", () => {
    expect(createVideoRequestSchema.parse({})).toEqual({});
  });
});

describe("shortIdSchema", () => {
  it("accepts 10 chars from the alphabet", () => {
    expect(shortIdSchema.safeParse("abcd23XYZq").success).toBe(true);
  });

  it("rejects wrong length or characters", () => {
    expect(shortIdSchema.safeParse("abc").success).toBe(false);
    expect(shortIdSchema.safeParse("abcd23XYZ0").success).toBe(false);
    expect(shortIdSchema.safeParse("abcd23XY/q").success).toBe(false);
  });
});

describe("authBridgeWebMessageSchema", () => {
  const valid = {
    source: "roll-web",
    type: "session",
    session: {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 1,
      user: { id: "u", email: null, name: null, avatarUrl: null },
    },
  };

  it("accepts a well-formed session message", () => {
    expect(authBridgeWebMessageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects messages from another source", () => {
    expect(authBridgeWebMessageSchema.safeParse({ ...valid, source: "evil" }).success).toBe(false);
  });
});

describe("apiErrorSchema", () => {
  it("validates the error envelope", () => {
    expect(
      apiErrorSchema.safeParse({ error: { code: "not_found", message: "Nope" } }).success,
    ).toBe(true);
    expect(apiErrorSchema.safeParse({ error: { code: "teapot", message: "" } }).success).toBe(
      false,
    );
  });
});

describe("helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("builds share urls without double slashes", () => {
    expect(buildShareUrl("https://roll.app/", "abc")).toBe("https://roll.app/v/abc");
  });
});
