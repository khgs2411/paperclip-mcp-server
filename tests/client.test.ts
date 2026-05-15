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

  it("sends Authorization: Bearer header when agentApiKey is set", async () => {
    const spy = mockFetchOnce(200, { ok: true });
    const c = new PaperclipClient({ apiBase: BASE, agentApiKey: "secret-token" });
    await c.request("GET", "/api/agents/me");
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/api/agents/me`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer secret-token" }),
      }),
    );
  });

  it("does not send Authorization header when agentApiKey is absent", async () => {
    const spy = mockFetchOnce(200, { ok: true });
    const c = new PaperclipClient({ apiBase: BASE });
    await c.request("GET", "/api/health");
    const callArgs = spy.mock.calls[0] as [string, RequestInit];
    const headers = callArgs[1]?.headers as Record<string, string> | undefined;
    expect(headers?.["Authorization"]).toBeUndefined();
  });

  it("sends both Authorization and Content-Type when body and key are present", async () => {
    const spy = mockFetchOnce(200, { id: "x" });
    const c = new PaperclipClient({ apiBase: BASE, agentApiKey: "my-key" });
    await c.request("PATCH", "/api/agents/x", { name: "Test" });
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/api/agents/x`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});
