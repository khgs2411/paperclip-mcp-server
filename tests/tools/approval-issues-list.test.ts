import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalIssuesListTool } from "../../src/tools/approval-issues-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_issues_list", () => {
  beforeEach(() => mock.restore());

  it("calls GET /api/approvals/:id/issues", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([{ id: "iss-1" }]);

    const result = await approvalIssuesListTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/approvals/appr-1/issues");
    expect(result).toEqual([{ id: "iss-1" }]);
  });
});
