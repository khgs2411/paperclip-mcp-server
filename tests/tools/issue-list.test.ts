import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueListTool } from "../../src/tools/issue-list.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("issue_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/issues with no filters", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    const result = await issueListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/CID/issues");
    expect(result).toEqual([]);
  });

  it("passes single status and assigneeAgentId filters as query string", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueListTool.handler({ status: "todo", assigneeAgentId: "A1" }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("status=todo");
    expect(path).toContain("assigneeAgentId=A1");
  });

  it("splits comma-separated statuses into one request per status", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce([{ id: "I1", status: "done" }])
      .mockResolvedValueOnce([{ id: "I2", status: "cancelled" }]);

    const result = await issueListTool.handler(
      { status: "done,cancelled", assigneeAgentId: "A1", limit: 10 },
      { client },
    );

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0]).toEqual([
      "GET",
      "/api/companies/CID/issues?status=done&assigneeAgentId=A1&limit=10",
    ]);
    expect(spy.mock.calls[1]).toEqual([
      "GET",
      "/api/companies/CID/issues?status=cancelled&assigneeAgentId=A1&limit=10",
    ]);
    expect(result).toEqual([
      { id: "I1", status: "done" },
      { id: "I2", status: "cancelled" },
    ]);
  });

  it("treats limit as per-status for multi-status results", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    spyOn(client, "request")
      .mockResolvedValueOnce([
        { id: "D1", status: "done" },
        { id: "D2", status: "done" },
      ])
      .mockResolvedValueOnce([
        { id: "C1", status: "cancelled" },
        { id: "C2", status: "cancelled" },
      ]);

    const result = await issueListTool.handler({ status: "done,cancelled", limit: 2 }, { client });

    expect(result).toEqual([
      { id: "D1", status: "done" },
      { id: "D2", status: "done" },
      { id: "C1", status: "cancelled" },
      { id: "C2", status: "cancelled" },
    ]);
  });

  it("throws ToolInputError for unsupported status values", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    await expect(issueListTool.handler({ status: "done,archived" }, { client })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("throws ToolInputError when no companyId and no env default", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(issueListTool.handler({}, { client })).rejects.toThrow("companyId");
  });
});
