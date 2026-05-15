import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { approvalCreateTool } from "../../src/tools/approval-create.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_approval_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/companies/:cid/approvals with full payload", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "cid1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "appr-new" });

    const result = await approvalCreateTool.handler(
      {
        type: "request_board_approval",
        requestedByAgentId: "ag-1",
        issueIds: ["iss-1"],
        payload: { title: "Approve spend", summary: "Need $50/mo" },
      },
      { client },
    );

    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/companies/cid1/approvals",
      {
        type: "request_board_approval",
        requestedByAgentId: "ag-1",
        issueIds: ["iss-1"],
        payload: { title: "Approve spend", summary: "Need $50/mo" },
      },
    );
    expect(result).toEqual({ id: "appr-new" });
  });

  it("throws ToolInputError when no companyId available", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      approvalCreateTool.handler(
        {
          type: "request_board_approval",
          requestedByAgentId: "ag-1",
          payload: { title: "T", summary: "S" },
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});
