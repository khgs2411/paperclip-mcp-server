import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalGetTool } from "../../src/tools/approval-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("paperclip_approval_get", () => {
  beforeEach(() => mock.restore());

  it("calls GET /api/approvals/:id", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "appr-1", status: "pending" });

    const result = await approvalGetTool.handler({ approvalId: "appr-1" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/approvals/appr-1");
    expect(result).toEqual({ id: "appr-1", status: "pending" });
  });
});
