import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issuePatchTool } from "../../src/tools/issue-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/issues/:id accepting TOP-N identifier", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "U1",
      identifier: "TOP-16",
      status: "in_progress",
      priority: "high",
      title: "Board Channel",
      assigneeAgentId: "A1",
    });
    const result = await issuePatchTool.handler(
      { issueIdOrIdentifier: "TOP-16", status: "in_progress", priority: "high" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-16", {
      status: "in_progress",
      priority: "high",
    });
    expect(result).toEqual({
      id: "U1",
      identifier: "TOP-16",
      status: "in_progress",
      priority: "high",
      title: "Board Channel",
      assigneeAgentId: "A1",
    });
  });

  it("rejects bad identifier strings", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({ issueIdOrIdentifier: "not-an-id", status: "done" }),
    ).rejects.toThrow();
  });

  it("rejects when no patchable fields are supplied", async () => {
    await expect(
      issuePatchTool.inputSchema.parseAsync({ issueIdOrIdentifier: "TOP-1" }),
    ).rejects.toThrow();
  });
});
