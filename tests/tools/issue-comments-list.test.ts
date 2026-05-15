import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCommentsListTool } from "../../src/tools/issue-comments-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_comments_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/issues/:id/comments", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueCommentsListTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/issues/TOP-1/comments");
  });

  it("appends after/order cursor params when after is set", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueCommentsListTool.handler({ issueId: "TOP-1", after: "C5" }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("after=C5");
    expect(path).toContain("order=asc");
  });

  it("rejects empty issueId", async () => {
    await expect(
      issueCommentsListTool.inputSchema.parseAsync({ issueId: "" }),
    ).rejects.toThrow();
  });
});
