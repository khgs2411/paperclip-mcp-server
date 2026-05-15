import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueApprovalLinkTool } from "../../src/tools/issue-approval-link.js";
import { issueApprovalUnlinkTool } from "../../src/tools/issue-approval-unlink.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_issue_approval_link", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/issues/:id/approvals with approvalId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ linked: true });

    const result = await issueApprovalLinkTool.handler(
      { issueIdOrIdentifier: "TOP-10", approvalId: "appr-1" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-10/approvals", {
      approvalId: "appr-1",
    });
    expect(result).toEqual({ linked: true });
  });

  it("rejects bad issue identifier", async () => {
    await expect(
      issueApprovalLinkTool.inputSchema.parseAsync({
        issueIdOrIdentifier: "not-an-id",
        approvalId: "appr-1",
      }),
    ).rejects.toThrow();
  });
});

describe("paperclip_issue_approval_unlink", () => {
  beforeEach(() => mock.restore());

  it("DELETEs /api/issues/:id/approvals/:approvalId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(null);

    await issueApprovalUnlinkTool.handler(
      { issueIdOrIdentifier: "TOP-10", approvalId: "appr-1" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-10/approvals/appr-1");
  });
});
