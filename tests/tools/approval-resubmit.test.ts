import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalResubmitTool } from "../../src/tools/approval-resubmit.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_resubmit", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/approvals/:id/resubmit without payload", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "pending" });

    await approvalResubmitTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/resubmit", {});
  });

  it("includes updated payload when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "pending" });

    const payload = { title: "Updated", summary: "New details", risks: ["Risk A"] };
    await approvalResubmitTool.handler({ approvalId: "appr-1", payload }, { client });

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/resubmit", { payload });
  });
});
