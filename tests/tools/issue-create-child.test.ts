import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCreateChildTool } from "../../src/tools/issue-create-child.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_create_child", () => {
  beforeEach(() => mock.restore());

  it("POSTs to /api/issues/:id/children", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "C1", identifier: "TOP-100" });
    const result = await issueCreateChildTool.handler(
      { issueId: "TOP-99", title: "Sub-task" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-99/children", { title: "Sub-task" });
    expect((result as { identifier: string }).identifier).toBe("TOP-100");
  });

  it("rejects missing issueId", async () => {
    await expect(
      issueCreateChildTool.inputSchema.parseAsync({ title: "x" }),
    ).rejects.toThrow();
  });

  it("rejects missing title", async () => {
    await expect(
      issueCreateChildTool.inputSchema.parseAsync({ issueId: "TOP-1" }),
    ).rejects.toThrow();
  });
});
