import { describe, expect, it } from "vitest";
import { SHORT_ID_LENGTH, shortIdSchema } from "@roll/shared";
import { generateShortId } from "./shortid";

describe("generateShortId", () => {
  it("produces 10-char ids from the URL-safe alphabet", () => {
    for (let i = 0; i < 1000; i += 1) {
      const id = generateShortId();
      expect(id).toHaveLength(SHORT_ID_LENGTH);
      expect(shortIdSchema.safeParse(id).success).toBe(true);
      expect(encodeURIComponent(id)).toBe(id);
    }
  });

  it("does not repeat across many draws", () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => generateShortId()));
    expect(ids.size).toBe(10_000);
  });
});
