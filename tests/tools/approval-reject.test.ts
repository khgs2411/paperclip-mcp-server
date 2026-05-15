import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalRejectTool } from "../../src/tools/approval-reject.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_reject", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/approvals/:id/reject without reason", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "rejected" });

    await approvalRejectTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/reject", {});
  });

  it("includes reason in body when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "rejected" });

    await approvalRejectTool.handler({ approvalId: "appr-1", reason: "too expensive" }, { client });

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/reject", {
      reason: "too expensive",
    });
  });
});
