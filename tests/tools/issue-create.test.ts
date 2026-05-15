import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCreateTool } from "../../src/tools/issue-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/companies/:cid/issues", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "I1", identifier: "TOP-99", title: "New task", status: "todo",
    });
    const result = await issueCreateTool.handler({ title: "New task" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/CID/issues", { title: "New task" });
    expect((result as { identifier: string }).identifier).toBe("TOP-99");
  });

  it("sends optional fields when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "I1" });
    await issueCreateTool.handler({
      title: "Bug",
      priority: "high",
      status: "todo",
      assigneeAgentId: "A1",
    }, { client });
    const [, , body] = spy.mock.calls[0]!;
    expect((body as Record<string, unknown>)["priority"]).toBe("high");
    expect((body as Record<string, unknown>)["assigneeAgentId"]).toBe("A1");
  });

  it("rejects missing title", async () => {
    await expect(issueCreateTool.inputSchema.parseAsync({})).rejects.toThrow();
  });

  it("rejects empty title", async () => {
    await expect(issueCreateTool.inputSchema.parseAsync({ title: "" })).rejects.toThrow();
  });
});
