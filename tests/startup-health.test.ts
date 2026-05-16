import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { handleCallTool } from "../src/handler.js";
import { PaperclipClient } from "../src/client.js";
import { PaperclipApiError } from "../src/shared/errors.js";

const UNHEALTHY = async () => false;
const HEALTHY = async () => true;
const NOOP_INVALIDATE = () => {};
const LOCAL_BOARD = { mode: "local_board" } as const;

describe("startup health check gate", () => {
  beforeEach(() => mock.restore());

  it("returns paperclip_unreachable for any tool call when getHealth returns false", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    const result = await handleCallTool("paperclip_issue_patch", {}, client, UNHEALTHY, NOOP_INVALIDATE, LOCAL_BOARD);
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as { code: string };
    expect(payload.code).toBe("paperclip_unreachable");
  });

  it("returns paperclip_unreachable even for unknown tool names when getHealth returns false", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    const result = await handleCallTool("nonexistent_tool", {}, client, UNHEALTHY, NOOP_INVALIDATE, LOCAL_BOARD);
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as { code: string };
    expect(payload.code).toBe("paperclip_unreachable");
  });

  it("dispatches to tool normally when getHealth returns true", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    spyOn(client, "request").mockResolvedValueOnce({
      id: "U1",
      identifier: "TOP-16",
      status: "done",
      title: "T",
      priority: "medium",
      assigneeAgentId: null,
    });
    const result = await handleCallTool(
      "paperclip_issue_patch",
      { issueIdOrIdentifier: "TOP-16", status: "done" },
      client,
      HEALTHY,
      NOOP_INVALIDATE,
      LOCAL_BOARD,
    );
    expect(result.isError).toBeUndefined();
    const body = JSON.parse(result.content[0]!.text) as { id: string };
    expect(body.id).toBe("U1");
  });

  it("calls invalidateHealth when tool call produces a 5xx error", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(503, { error: "unavailable" }, "/api/issues/TOP-1"),
    );
    let invalidated = false;
    const result = await handleCallTool(
      "paperclip_issue_get_full",
      { issueIdOrIdentifier: "TOP-1" },
      client,
      HEALTHY,
      () => { invalidated = true; },
      LOCAL_BOARD,
    );
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as { code: string; statusCode: number };
    expect(payload.code).toBe("paperclip_api_error");
    expect(payload.statusCode).toBe(503);
    expect(invalidated).toBe(true);
  });

  it("does not call invalidateHealth for 4xx errors", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(404, { error: "not found" }, "/api/issues/TOP-999"),
    );
    let invalidated = false;
    await handleCallTool(
      "paperclip_issue_get_full",
      { issueIdOrIdentifier: "TOP-999" },
      client,
      HEALTHY,
      () => { invalidated = true; },
      LOCAL_BOARD,
    );
    expect(invalidated).toBe(false);
  });
});
