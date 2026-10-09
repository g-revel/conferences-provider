import { describe, it, expect } from "vitest";
import { stripHtml, decodeHtmlEntities } from "./html.functions.js";

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<div>  Hello   <b>world</b>  </div>")).toBe("Hello world");
  });

  it("removes script and style blocks entirely, including their content", () => {
    const html = "<style>.a{color:red}</style><p>Keep</p><script>alert(1)</script>";
    expect(stripHtml(html)).toBe("Keep");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("Tom &amp; Jerry &mdash; &quot;fun&quot;")).toBe('Tom & Jerry &mdash; "fun"');
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes an apostrophe entity", () => {
    expect(decodeHtmlEntities("l&#39;architecture")).toBe("l'architecture");
  });

  it("leaves an unknown entity untouched", () => {
    expect(decodeHtmlEntities("Tom &mdash; Jerry")).toBe("Tom &mdash; Jerry");
  });

  it("leaves plain text untouched", () => {
    expect(decodeHtmlEntities("rien a decoder")).toBe("rien a decoder");
  });
});
