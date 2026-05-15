import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalCommentsListTool } from "../../src/tools/approval-comments-list.js";
import { approvalCommentAddTool } from "../../src/tools/approval-comment-add.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_comments_list", () => {
  beforeEach(() => mock.restore());

  it("calls GET /api/approvals/:id/comments", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([{ id: "c1", body: "LGTM" }]);

    const result = await approvalCommentsListTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/approvals/appr-1/comments");
    expect(result).toEqual([{ id: "c1", body: "LGTM" }]);
  });
});

describe("paperclip_approval_comment_add", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/approvals/:id/comments with body", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "c-new" });

    const result = await approvalCommentAddTool.handler(
      { approvalId: "appr-1", body: "Approved!" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/comments", {
      body: "Approved!",
    });
    expect(result).toEqual({ id: "c-new" });
  });
});
