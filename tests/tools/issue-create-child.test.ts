import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCreateChildTool } from "../../src/tools/issue-create-child.js";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";

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

  it("blocks another gate child when the parent already has too many gate siblings", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce([
        {
          details: {
            currentReferencedIssues: [
              { identifier: "TOP-10", title: "[M5] Design artifact contract" },
              { identifier: "TOP-11", title: "[M5] Audit artifact contract design" },
              { identifier: "TOP-12", title: "[M5] Write implementation plan" },
              { identifier: "TOP-13", title: "[M5] Audit implementation plan" },
            ],
          },
        },
      ]);

    await expect(
      issueCreateChildTool.handler(
        { issueId: "TOP-9", title: "[M5] Re-audit implementation plan" },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("GET", "/api/issues/TOP-9/activity?limit=50");
  });

  it("blocks a third gate child after one package and one audit child already exist", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request")
      .mockResolvedValueOnce([
        {
          details: {
            currentReferencedIssues: [
              { identifier: "TOP-10", title: "[M5] Design and implementation package" },
              { identifier: "TOP-11", title: "[M5] Audit design and implementation package" },
            ],
          },
        },
      ]);

    await expect(
      issueCreateChildTool.handler(
        { issueId: "TOP-9", title: "[M5] Re-audit implementation plan" },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
  });
});
