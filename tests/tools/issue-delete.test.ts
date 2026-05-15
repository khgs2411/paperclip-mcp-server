import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueDeleteTool } from "../../src/tools/issue-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs /api/issues/:id when confirm=true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ deleted: true });
    await issueDeleteTool.handler({ issueId: "TOP-99", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-99");
  });

  it("rejects when confirm is missing from schema", async () => {
    await expect(
      issueDeleteTool.inputSchema.parseAsync({ issueId: "TOP-99" }),
    ).rejects.toThrow();
  });

  it("rejects when confirm is false", async () => {
    await expect(
      issueDeleteTool.inputSchema.parseAsync({ issueId: "TOP-99", confirm: false }),
    ).rejects.toThrow();
  });
});
