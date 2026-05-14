import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueGetFullTool } from "../../src/tools/issue-get-full.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_get_full", () => {
  beforeEach(() => mock.restore());

  it("combines /api/issues/:id with /api/issues/:id/comments", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "U1",
        identifier: "TOP-16",
        title: "Board Channel",
        status: "in_progress",
        priority: "high",
        assigneeAgentId: "A1",
        projectId: "P1",
        description: "body",
        parentId: null,
        ancestors: [],
        blockedBy: [],
        blocks: [],
        relatedWork: { outbound: [], inbound: [] },
        checkoutRunId: null,
        createdAt: "2026-05-14T15:00:00Z",
        updatedAt: "2026-05-14T16:00:00Z",
      })
      .mockResolvedValueOnce([
        { id: "C1", body: "hi", authorType: "agent", createdAt: "2026-05-14T15:30:00Z" },
      ]);
    const result = await issueGetFullTool.handler(
      { issueIdOrIdentifier: "TOP-16" },
      { client },
    );
    expect(spy).toHaveBeenNthCalledWith(1, "GET", "/api/issues/TOP-16");
    expect(spy).toHaveBeenNthCalledWith(2, "GET", "/api/issues/TOP-16/comments");
    expect((result as { identifier: string }).identifier).toBe("TOP-16");
    expect((result as { comments: unknown[] }).comments).toHaveLength(1);
    expect((result as { checkoutRunId: string | null }).checkoutRunId).toBeNull();
  });

  it("rejects malformed identifiers", async () => {
    await expect(
      issueGetFullTool.inputSchema.parseAsync({ issueIdOrIdentifier: "bogus" }),
    ).rejects.toThrow();
  });
});
