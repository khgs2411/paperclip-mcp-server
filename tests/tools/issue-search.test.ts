import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueSearchTool } from "../../src/tools/issue-search.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_search", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/issues?q=...", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueSearchTool.handler({ q: "bug fix" }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("/api/companies/CID/issues");
    expect(path).toContain("q=bug+fix");
  });

  it("rejects empty q", async () => {
    await expect(
      issueSearchTool.inputSchema.parseAsync({ q: "" }),
    ).rejects.toThrow();
  });

  it("rejects missing q", async () => {
    await expect(
      issueSearchTool.inputSchema.parseAsync({}),
    ).rejects.toThrow();
  });
});
