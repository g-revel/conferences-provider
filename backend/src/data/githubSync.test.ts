import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { commitJsonToGitHub } from "./githubSync.js";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("commitJsonToGitHub", () => {
  it("does nothing when GITHUB_TOKEN is not configured", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("GITHUB_REPO", "shodo/conferences-provider");

    await commitJsonToGitHub("/app/backend/data/talks.json", "{}", "message");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when GITHUB_REPO is not configured", async () => {
    vi.stubEnv("GITHUB_TOKEN", "fake-token");
    vi.stubEnv("GITHUB_REPO", "");

    await commitJsonToGitHub("/app/backend/data/talks.json", "{}", "message");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the existing file sha then PUTs the new content, base64-encoded, on the configured branch", async () => {
    vi.stubEnv("GITHUB_TOKEN", "fake-token");
    vi.stubEnv("GITHUB_REPO", "shodo/conferences-provider");
    vi.stubEnv("GITHUB_BRANCH", "main");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ sha: "abc123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await commitJsonToGitHub("/app/backend/data/talks.json", '{"a":1}', "Met à jour talks.json (admin)");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.github.com/repos/shodo/conferences-provider/contents/backend/data/talks.json?ref=main",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer fake-token" }) }),
    );

    const [putUrl, putOptions] = fetchMock.mock.calls[1];
    expect(putUrl).toBe("https://api.github.com/repos/shodo/conferences-provider/contents/backend/data/talks.json");
    expect(putOptions.method).toBe("PUT");
    const body = JSON.parse(putOptions.body);
    expect(body.message).toBe("Met à jour talks.json (admin)");
    expect(body.branch).toBe("main");
    expect(body.sha).toBe("abc123");
    expect(Buffer.from(body.content, "base64").toString("utf-8")).toBe('{"a":1}');
  });

  it("omits sha when the file does not exist yet on that branch", async () => {
    vi.stubEnv("GITHUB_TOKEN", "fake-token");
    vi.stubEnv("GITHUB_REPO", "shodo/conferences-provider");
    fetchMock
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await commitJsonToGitHub("/app/backend/data/talks.json", "{}", "message");

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.sha).toBeUndefined();
  });

  it("throws when the PUT request fails", async () => {
    vi.stubEnv("GITHUB_TOKEN", "fake-token");
    vi.stubEnv("GITHUB_REPO", "shodo/conferences-provider");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ sha: "abc123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("forbidden", { status: 403 }));

    await expect(commitJsonToGitHub("/app/backend/data/talks.json", "{}", "message")).rejects.toThrow(
      /Échec du commit GitHub/,
    );
  });
});
