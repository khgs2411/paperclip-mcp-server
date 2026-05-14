import { describe, it, expect, spyOn, beforeEach, afterEach, mock } from "bun:test";
import { PaperclipClient } from "../src/client.js";
import {
  PaperclipApiError,
  PaperclipUnreachableError,
} from "../src/shared/errors.js";

const BASE = "http://127.0.0.1:3100";

function mockFetchOnce(status: number, body: unknown) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
  return spyOn(globalThis, "fetch").mockResolvedValueOnce(res);
}

function mockFetchReject(err: Error) {
  return spyOn(globalThis, "fetch").mockRejectedValueOnce(err);
}

describe("PaperclipClient", () => {
  beforeEach(() => {
    mock.restore();
  });
  afterEach(() => {
    mock.restore();
  });

  it("GET returns parsed JSON on 2xx", async () => {
    mockFetchOnce(200, { ok: true });
    const c = new PaperclipClient({ apiBase: BASE });
    const result = await c.request("GET", "/api/health");
    expect(result).toEqual({ ok: true });
  });

  it("PATCH sends body as JSON and returns parsed response", async () => {
    const spy = mockFetchOnce(200, { id: "x", name: "Foo" });
    const c = new PaperclipClient({ apiBase: BASE });
    const result = await c.request("PATCH", "/api/agents/x", { name: "Foo" });
    expect(result).toEqual({ id: "x", name: "Foo" });
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/api/agents/x`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: "Foo" }),
      }),
    );
  });

  it("non-2xx throws PaperclipApiError with statusCode, body, and path", async () => {
    mockFetchOnce(404, { error: "not found" });
    const c = new PaperclipClient({ apiBase: BASE });
    await expect(c.request("GET", "/api/agents/nope")).rejects.toBeInstanceOf(PaperclipApiError);
    mockFetchOnce(404, { error: "not found" });
    try {
      await c.request("GET", "/api/agents/nope");
    } catch (e) {
      const err = e as PaperclipApiError;
      expect(err.statusCode).toBe(404);
      expect(err.body).toEqual({ error: "not found" });
      expect(err.path).toBe("/api/agents/nope");
    }
  });

  it("fetch network failure throws PaperclipUnreachableError", async () => {
    mockFetchReject(new TypeError("fetch failed"));
    const c = new PaperclipClient({ apiBase: BASE });
    await expect(c.request("GET", "/api/health")).rejects.toBeInstanceOf(PaperclipUnreachableError);
  });

  it("resolveCompanyId returns env value when provided", () => {
    const c = new PaperclipClient({ apiBase: BASE, defaultCompanyId: "abc-123" });
    expect(c.resolveCompanyId(undefined)).toBe("abc-123");
    expect(c.resolveCompanyId("override-id")).toBe("override-id");
  });

  it("resolveCompanyId throws when neither input nor env is set", () => {
    const c = new PaperclipClient({ apiBase: BASE });
    expect(() => c.resolveCompanyId(undefined)).toThrow();
  });
});
