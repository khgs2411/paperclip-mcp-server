import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxSummaryTool } from "../../src/tools/inbox-summary.js";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError, ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_summary", () => {
  beforeEach(() => mock.restore());

  it("returns combined counts from two endpoints", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce([{ id: "a1" }]) // approvals
      .mockResolvedValueOnce([{ id: "r1" }, { id: "r2" }, { id: "r3" }]); // in_review

    const result = await inboxSummaryTool.handler({ companyId: "cid1" }, { client });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      pendingApprovals: 1,
      totalInReview: 3,
    });
  });

  it("uses defaultCompanyId from client when companyId omitted", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "auto-cid",
    });
    spyOn(client, "request")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await inboxSummaryTool.handler({}, { client });
    expect(result).toEqual({
      pendingApprovals: 0,
      totalInReview: 0,
    });
  });

  it("throws ToolInputError when no companyId is available", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      inboxSummaryTool.handler({}, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("propagates API errors instead of swallowing them", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      defaultCompanyId: "cid1",
    });
    const apiError = new PaperclipApiError(500, { error: "internal" }, "/api/companies/cid1/approvals");
    spyOn(client, "request").mockRejectedValueOnce(apiError);

    await expect(
      inboxSummaryTool.handler({ companyId: "cid1" }, { client }),
    ).rejects.toBeInstanceOf(PaperclipApiError);
  });
});
