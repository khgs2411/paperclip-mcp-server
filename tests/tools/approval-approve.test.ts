import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalApproveTool } from "../../src/tools/approval-approve.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_approval_approve", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/approvals/:id/approve when confirm is true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "approved" });

    const result = await approvalApproveTool.handler(
      { approvalId: "appr-1", confirm: true },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/approve", {});
    expect(result).toEqual({ status: "approved" });
  });

  it("includes comment in body when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "approved" });

    await approvalApproveTool.handler(
      { approvalId: "appr-1", confirm: true, comment: "LGTM" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("POST", "/api/approvals/appr-1/approve", {
      comment: "LGTM",
    });
  });

  it("rejects inputSchema when confirm is not provided (required literal true)", async () => {
    await expect(
      approvalApproveTool.inputSchema.parseAsync({ approvalId: "appr-1" }),
    ).rejects.toThrow();
  });

  it("throws ToolInputError at runtime if confirm is somehow false", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    // Cast to bypass TS check for runtime safety test
    await expect(
      approvalApproveTool.handler(
        { approvalId: "appr-1", confirm: false as unknown as true },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});
