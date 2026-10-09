import { describe, it, expect } from "vitest";
import { parseDurationSeconds, isLikelyFullTalk } from "./isLikelyFullTalk.js";

describe("parseDurationSeconds", () => {
  it("parses mm:ss", () => {
    expect(parseDurationSeconds("45:33")).toBe(45 * 60 + 33);
  });

  it("parses h:mm:ss", () => {
    expect(parseDurationSeconds("1:02:03")).toBe(1 * 3600 + 2 * 60 + 3);
  });

  it("returns null when absent", () => {
    expect(parseDurationSeconds(undefined)).toBeNull();
  });

  it("returns null when malformed", () => {
    expect(parseDurationSeconds("not-a-duration")).toBeNull();
  });
});

describe("isLikelyFullTalk", () => {
  it("accepts a video of 10 minutes or more", () => {
    expect(isLikelyFullTalk({ length: "45:33" })).toBe(true);
  });

  it("rejects a short video (trailer/short)", () => {
    expect(isLikelyFullTalk({ length: "00:45" })).toBe(false);
  });

  it("does not filter out a video with unknown duration", () => {
    expect(isLikelyFullTalk({ length: undefined })).toBe(true);
  });
});
