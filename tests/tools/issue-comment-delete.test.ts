import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCommentDeleteTool } from "../../src/tools/issue-comment-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_comment_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs /api/issues/:id/comments/:cid when confirm=true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ deleted: true });
    await issueCommentDeleteTool.handler(
      { issueId: "TOP-1", commentId: "C1", confirm: true },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-1/comments/C1");
  });

  it("rejects missing confirm", async () => {
    await expect(
      issueCommentDeleteTool.inputSchema.parseAsync({ issueId: "TOP-1", commentId: "C1" }),
    ).rejects.toThrow();
  });

  it("rejects confirm=false", async () => {
    await expect(
      issueCommentDeleteTool.inputSchema.parseAsync({ issueId: "TOP-1", commentId: "C1", confirm: false }),
    ).rejects.toThrow();
  });
});
