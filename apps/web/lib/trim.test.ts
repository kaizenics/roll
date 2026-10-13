import { describe, expect, it } from "vitest";
import { formatTimecode, isUntrimmed, moveEdge, rulerTicks, secondsAt } from "./trim";

describe("moveEdge", () => {
  const full = { start: 0, end: 17.96 };

  it("moves an edge within the video", () => {
    expect(moveEdge(full, "start", 3.2, 17.96)).toEqual({ start: 3.2, end: 17.96 });
    expect(moveEdge(full, "end", 10, 17.96)).toEqual({ start: 0, end: 10 });
  });

  it("clamps to the video bounds", () => {
    expect(moveEdge(full, "start", -4, 17.96).start).toBe(0);
    expect(moveEdge(full, "end", 99, 17.96).end).toBe(17.96);
  });

  it("keeps at least one second between the handles", () => {
    expect(moveEdge({ start: 5, end: 8 }, "start", 7.9, 17.96)).toEqual({ start: 7, end: 8 });
    expect(moveEdge({ start: 5, end: 8 }, "end", 5.2, 17.96)).toEqual({ start: 5, end: 6 });
  });
});

describe("helpers", () => {
  it("maps pointer x to seconds", () => {
    expect(secondsAt(50, 200, 20)).toBe(5);
    expect(secondsAt(-10, 200, 20)).toBe(0);
    expect(secondsAt(500, 200, 20)).toBe(20);
    expect(secondsAt(10, 0, 20)).toBe(0);
  });

  it("formats timecodes with tenths and never disagrees with itself", () => {
    expect(formatTimecode(0)).toBe("0:00.0");
    expect(formatTimecode(17.96)).toBe("0:18.0");
    expect(formatTimecode(67.44)).toBe("1:07.4");
  });

  it("builds a readable ruler", () => {
    expect(rulerTicks(18)).toEqual([0, 5, 10, 15]);
    expect(rulerTicks(4)).toEqual([0, 1, 2, 3, 4]);
  });

  it("detects an untouched range", () => {
    expect(isUntrimmed({ start: 0, end: 17.96 }, 17.96)).toBe(true);
    expect(isUntrimmed({ start: 0.5, end: 17.96 }, 17.96)).toBe(false);
  });
});
