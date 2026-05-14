import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxSummaryTool } from "../../src/tools/inbox-summary.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_summary", () => {
  beforeEach(() => mock.restore());

  it("returns combined counts from three endpoints", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce([{ id: "i1" }, { id: "i2" }]) // interactions
      .mockResolvedValueOnce([{ id: "a1" }]) // approvals
      .mockResolvedValueOnce([{ id: "r1" }, { id: "r2" }, { id: "r3" }]); // unassigned in_review

    const result = await inboxSummaryTool.handler({ companyId: "cid1" }, { client });

    expect(spy).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      pendingInteractions: 2,
      pendingApprovals: 1,
      unassignedInReview: 3,
    });
  });

  it("uses defaultCompanyId from client when companyId omitted", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "auto-cid",
    });
    spyOn(client, "request")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await inboxSummaryTool.handler({}, { client });
    expect(result).toEqual({
      pendingInteractions: 0,
      pendingApprovals: 0,
      unassignedInReview: 0,
    });
  });

  it("throws ToolInputError when no companyId is available", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      inboxSummaryTool.handler({}, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});
