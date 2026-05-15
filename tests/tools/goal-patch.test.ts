import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalPatchTool } from "../../src/tools/goal-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes goal and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "G1", title: "Updated", status: "active" });
    const result = await goalPatchTool.handler({ goalId: "G1", status: "done" }, { client });
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/goals/G1?companyId=C1", { status: "done" });
    expect(result).toEqual({ id: "G1", title: "Updated", status: "active" });
  });

  it("rejects when no patch fields provided", async () => {
    await expect(
      goalPatchTool.inputSchema.parseAsync({ goalId: "G1" }),
    ).rejects.toThrow();
  });
});
