import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { inboxSummaryTool } from "../../src/tools/inbox-summary.js";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError, ToolInputError } from "../../src/shared/errors.js";

describe("paperclip_inbox_summary — no agent key (company-wide fallback)", () => {
  beforeEach(() => mock.restore());

  it("returns combined counts from approvals and in-review endpoints", async () => {
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
      .mockResolvedValueOnce([]);
    const result = await inboxSummaryTool.handler({}, { client });
    expect(result).toEqual({ pendingApprovals: 0, unassignedInReview: 0 });
  });

  it("throws ToolInputError when no companyId is available and no agent key", async () => {
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

describe("paperclip_inbox_summary — with agent key (inbox-lite path)", () => {
  beforeEach(() => mock.restore());

  it("calls /agents/me/inbox-lite and returns its response directly", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      agentApiKey: "test-key-abc",
    });
    const inboxData = { items: [{ id: "i1", title: "Fix bug" }], total: 1 };
    const spy = spyOn(client, "request").mockResolvedValueOnce(inboxData);

    const result = await inboxSummaryTool.handler({}, { client });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/me/inbox-lite");
    expect(result).toEqual(inboxData);
  });

  it("does not require companyId when agent key is set", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      agentApiKey: "key-xyz",
      // no defaultCompanyId
    });
    spyOn(client, "request").mockResolvedValueOnce({ items: [], total: 0 });

    await expect(inboxSummaryTool.handler({}, { client })).resolves.toBeDefined();
  });

  it("propagates API errors from inbox-lite path", async () => {
    const client = new PaperclipClient({
      apiBase: "http://x",
      agentApiKey: "key-xyz",
    });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(401, { error: "unauthorized" }, "/api/agents/me/inbox-lite"),
    );
    await expect(inboxSummaryTool.handler({}, { client })).rejects.toBeInstanceOf(PaperclipApiError);
  });
});
