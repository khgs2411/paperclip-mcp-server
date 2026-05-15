import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCountTool } from "../../src/tools/issue-count.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_count", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/issues/count", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ count: 5 });
    const result = await issueCountTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/CID/issues/count");
    expect((result as { count: number }).count).toBe(5);
  });

  it("passes status filter", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ count: 2 });
    await issueCountTool.handler({ status: "todo" }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("status=todo");
  });

  it("throws when companyId missing", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(issueCountTool.handler({}, { client })).rejects.toThrow("companyId");
  });
});
