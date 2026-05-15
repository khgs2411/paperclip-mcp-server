import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueInteractionCreateTool } from "../../src/tools/issue-interaction-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_interaction_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/issues/:id/interactions", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "INT-1" });
    await issueInteractionCreateTool.handler(
      { issueId: "TOP-1", kind: "request_confirmation", prompt: "Approve plan?" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/issues/TOP-1/interactions",
      { kind: "request_confirmation", prompt: "Approve plan?" },
    );
  });

  it("rejects invalid kind", async () => {
    await expect(
      issueInteractionCreateTool.inputSchema.parseAsync({
        issueId: "TOP-1", kind: "invalid_kind", prompt: "?"
      }),
    ).rejects.toThrow();
  });

  it("rejects empty prompt", async () => {
    await expect(
      issueInteractionCreateTool.inputSchema.parseAsync({
        issueId: "TOP-1", kind: "request_confirmation", prompt: ""
      }),
    ).rejects.toThrow();
  });
});
