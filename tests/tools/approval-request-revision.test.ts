import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalRequestRevisionTool } from "../../src/tools/approval-request-revision.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_request_revision", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/approvals/:id/request-revision without feedback", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "revision_requested" });

    await approvalRequestRevisionTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/request-revision", {});
  });

  it("includes feedback in body when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "revision_requested" });

    await approvalRequestRevisionTool.handler(
      { approvalId: "appr-1", feedback: "please add risk analysis" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/request-revision", {
      feedback: "please add risk analysis",
    });
  });
});
