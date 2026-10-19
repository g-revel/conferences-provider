import { describe, it, expect } from "vitest";
import { isValidAdminPassword } from "./adminAuth.js";

describe("isValidAdminPassword", () => {
  it("accepts the configured password", () => {
    expect(isValidAdminPassword("Shodo")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(isValidAdminPassword("wrong")).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(isValidAdminPassword(undefined)).toBe(false);
    expect(isValidAdminPassword(null)).toBe(false);
    expect(isValidAdminPassword(123)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidAdminPassword("shodo")).toBe(false);
  });
});
