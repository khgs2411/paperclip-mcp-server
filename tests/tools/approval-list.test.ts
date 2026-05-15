import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalListTool } from "../../src/tools/approval-list.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_approval_list", () => {
  beforeEach(() => mock.restore());

  it("calls GET /api/companies/:cid/approvals without filter", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([{ id: "a1" }]);

    const result = await approvalListTool.handler({}, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/cid1/approvals");
    expect(result).toEqual([{ id: "a1" }]);
  });

  it("appends status filter when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);

    await approvalListTool.handler({ status: "pending" }, { client });

    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/cid1/approvals?status=pending");
  });

  it("throws ToolInputError when no companyId available", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(approvalListTool.handler({}, { client })).rejects.toBeInstanceOf(ToolInputError);
  });
});
