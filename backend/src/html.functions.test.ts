import { describe, it, expect } from "vitest";
import { stripHtml } from "./html.functions.js";

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
