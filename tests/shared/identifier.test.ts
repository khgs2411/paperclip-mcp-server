import { describe, it, expect } from "bun:test";
import { isUuid, isTopIdentifier, normalizeIssueRef } from "../../src/shared/identifier.js";

describe("identifier helpers", () => {
  it("isUuid recognises canonical UUIDs", () => {
    expect(isUuid("89d5794e-a271-470f-a02c-636e6573ef92")).toBe(true);
    expect(isUuid("TOP-16")).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("isTopIdentifier recognises TOP-N style identifiers", () => {
    expect(isTopIdentifier("TOP-16")).toBe(true);
    expect(isTopIdentifier("OZD-99")).toBe(true);
    expect(isTopIdentifier("89d5794e-a271-470f-a02c-636e6573ef92")).toBe(false);
    expect(isTopIdentifier("not-an-identifier")).toBe(false);
  });

  it("normalizeIssueRef returns the input unchanged for valid UUIDs and identifiers", () => {
    expect(normalizeIssueRef("TOP-16")).toBe("TOP-16");
    expect(normalizeIssueRef("89d5794e-a271-470f-a02c-636e6573ef92"))
      .toBe("89d5794e-a271-470f-a02c-636e6573ef92");
  });

  it("normalizeIssueRef throws on invalid input", () => {
    expect(() => normalizeIssueRef("not-valid")).toThrow();
  });
});
