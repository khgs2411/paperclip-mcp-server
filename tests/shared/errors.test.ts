import { describe, it, expect } from "bun:test";
import {
  PaperclipUnreachableError,
  PaperclipApiError,
  ToolInputError,
  toToolErrorPayload,
} from "../../src/shared/errors.js";

describe("error classes", () => {
  it("PaperclipUnreachableError carries a recovery command", () => {
    const err = new PaperclipUnreachableError("http://127.0.0.1:3100");
    expect(err.code).toBe("paperclip_unreachable");
    expect(err.recoveryCommand).toContain("paperclipai");
  });

  it("PaperclipApiError carries status, body, and path", () => {
    const err = new PaperclipApiError(404, { error: "not found" }, "/api/agents/x");
    expect(err.code).toBe("paperclip_api_error");
    expect(err.statusCode).toBe(404);
    expect(err.body).toEqual({ error: "not found" });
    expect(err.path).toBe("/api/agents/x");
  });

  it("ToolInputError names the offending field", () => {
    const err = new ToolInputError("agentId", "required");
    expect(err.code).toBe("tool_input_error");
    expect(err.field).toBe("agentId");
    expect(err.constraint).toBe("required");
  });

  it("toToolErrorPayload returns a plain JSON shape for any of the three errors", () => {
    const u = toToolErrorPayload(new PaperclipUnreachableError("http://x"));
    expect(u).toMatchObject({ code: "paperclip_unreachable" });

    const a = toToolErrorPayload(new PaperclipApiError(500, { error: "boom" }, "/x"));
    expect(a).toMatchObject({ code: "paperclip_api_error", statusCode: 500 });

    const t = toToolErrorPayload(new ToolInputError("foo", "required"));
    expect(t).toMatchObject({ code: "tool_input_error", field: "foo" });
  });
});
