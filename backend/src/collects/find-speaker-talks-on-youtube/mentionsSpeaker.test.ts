import { describe, it, expect } from "vitest";
import { mentionsSpeaker } from "./mentionsSpeaker.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };

describe("mentionsSpeaker", () => {
  it("returns true when the title contains the speaker's first and last name", () => {
    const video = { url: "https://youtube.com/watch?v=1", title: "The Hive pattern (Julien Topçu)", author: "MiXiT" };

    expect(mentionsSpeaker(video, topcu)).toBe(true);
  });

  it("returns true when the name is only in the channel name", () => {
    const video = { url: "https://youtube.com/watch?v=1", title: "Talk title", author: "Julien Topcu" };

    expect(mentionsSpeaker(video, topcu)).toBe(true);
  });

  it("returns false when the video credits a different person entirely", () => {
    const video = {
      url: "https://youtube.com/watch?v=1",
      title: "APIs, Microservices et le Service Mesh (J. Gauci)",
      author: "Devoxx France",
    };

    expect(mentionsSpeaker(video, topcu)).toBe(false);
  });

  it("requires both first and last name, not just one", () => {
    const video = { url: "https://youtube.com/watch?v=1", title: "Julien's other talk", author: "X" };

    expect(mentionsSpeaker(video, topcu)).toBe(false);
  });
});
