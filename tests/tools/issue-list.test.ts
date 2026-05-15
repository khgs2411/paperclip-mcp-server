import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueListTool } from "../../src/tools/issue-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/issues with no filters", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    const result = await issueListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/CID/issues");
    expect(result).toEqual([]);
  });

  it("passes status and assigneeAgentId filters as query string", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueListTool.handler({ status: "todo,in_progress", assigneeAgentId: "A1" }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("status=todo%2Cin_progress");
    expect(path).toContain("assigneeAgentId=A1");
  });

  it("throws ToolInputError when no companyId and no env default", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(issueListTool.handler({}, { client })).rejects.toThrow("companyId");
  });
});
