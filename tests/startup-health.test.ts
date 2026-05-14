import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { handleCallTool } from "../src/handler.js";
import { PaperclipClient } from "../src/client.js";

describe("startup health check gate", () => {
  beforeEach(() => mock.restore());

  it("returns paperclip_unreachable for any tool call when isHealthy=false", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    const result = await handleCallTool("paperclip_issue_patch", {}, client, false);
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as { code: string };
    expect(payload.code).toBe("paperclip_unreachable");
  });

  it("returns paperclip_unreachable even for unknown tool names when isHealthy=false", async () => {
    const client = new PaperclipClient({ apiBase: "http://127.0.0.1:3100" });
    const result = await handleCallTool("nonexistent_tool", {}, client, false);
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as { code: string };
    expect(payload.code).toBe("paperclip_unreachable");
  });

  it("dispatches to tool normally when isHealthy=true", async () => {
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
      true,
    );
    expect(result.isError).toBeUndefined();
    const body = JSON.parse(result.content[0]!.text) as { id: string };
    expect(body.id).toBe("U1");
  });
});
