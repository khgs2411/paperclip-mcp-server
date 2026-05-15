import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCommentAddTool } from "../../src/tools/issue-comment-add.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_comment_add", () => {
  beforeEach(() => mock.restore());

  it("POSTs body to /api/issues/:id/comments", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "C1" });
    await issueCommentAddTool.handler({ issueId: "TOP-1", body: "hello" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/comments", { body: "hello" });
  });

  it("rejects empty body", async () => {
    await expect(
      issueCommentAddTool.inputSchema.parseAsync({ issueId: "TOP-1", body: "" }),
    ).rejects.toThrow();
  });

  it("rejects missing issueId", async () => {
    await expect(
      issueCommentAddTool.inputSchema.parseAsync({ body: "hi" }),
    ).rejects.toThrow();
  });
});
