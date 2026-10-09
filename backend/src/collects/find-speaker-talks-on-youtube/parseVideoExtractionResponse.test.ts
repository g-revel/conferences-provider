import { describe, it, expect } from "vitest";
import { parseVideoExtractionResponse } from "./parseVideoExtractionResponse.js";

describe("parseVideoExtractionResponse", () => {
  it("extracts conferenceName and title when isConferenceTalk is true", () => {
    const raw = JSON.stringify({
      isConferenceTalk: true,
      conferenceName: "MiXiT",
      title: "The Hive pattern: a modularization strategy",
    });

    expect(parseVideoExtractionResponse(raw)).toEqual({
      conferenceName: "MiXiT",
      title: "The Hive pattern: a modularization strategy",
    });
  });

  it("returns null when isConferenceTalk is false", () => {
    const raw = JSON.stringify({ isConferenceTalk: false, conferenceName: null, title: null });

    expect(parseVideoExtractionResponse(raw)).toBeNull();
  });

  it("returns null when conferenceName is missing", () => {
    const raw = JSON.stringify({ isConferenceTalk: true, conferenceName: null, title: "Some title" });

    expect(parseVideoExtractionResponse(raw)).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    expect(parseVideoExtractionResponse("not json")).toBeNull();
  });

  it("sanitizes unicode escape and html entity artifacts in the extracted text", () => {
    const raw = JSON.stringify({
      isConferenceTalk: true,
      conferenceName: "BreizhCamp",
      title: "L\\u0027architecture hexagonale &#39;en pratique&#39;",
    });

    expect(parseVideoExtractionResponse(raw)).toEqual({
      conferenceName: "BreizhCamp",
      title: "L'architecture hexagonale 'en pratique'",
    });
  });
});
